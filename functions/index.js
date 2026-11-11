/**
 * DAWAYA Server-Side AI Proxy & Security Cloud Functions (Stage 3 Hardened)
 * - Keeps GEMINI_API_KEY exclusively in Google Cloud Secret Manager / Server Env.
 * - Enforces distributed cross-instance rate limiting (per-UID and per-IP) via Firestore transactions.
 * - Enforces Firebase Auth ID token verification + optional Firebase App Check verification.
 * - Enforces approved model allowlist and strips patient PII before calling upstream AI.
 */
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');

const ALLOWED_MODELS = new Set(['gemini-2.0-flash', 'gemini-2.5-flash']);
const MAX_REQ_PER_UID_PER_MIN = 20;
const MAX_REQ_PER_IP_PER_MIN = 40;
const RATE_WINDOW_MS = 60 * 1000;
const MAX_TEXT_CHARS = 12000;
const MAX_BASE64_CHARS = 5500000; // ~4MB binary

function sanitizePromptPii(rawText) {
  return String(rawText || '')
    .replace(/\b\d{14}\b/g, '[REDACTED_NATIONAL_ID]')
    .replace(/\b(?:\+?20|0)?1[0125]\d{8}\b/g, '[REDACTED_PHONE]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[REDACTED_EMAIL]');
}

/**
 * Shared cross-instance sliding-window rate limiter backed by Firestore transactions.
 */
async function checkDistributedRateLimit(bucketKey, maxAllowed) {
  const safeId = bucketKey.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
  const ref = db.collection('_rateLimits').doc(safeId);
  const now = Date.now();

  return await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? snap.data() : { timestamps: [] };
    const recent = Array.isArray(data.timestamps)
      ? data.timestamps.filter((t) => typeof t === 'number' && now - t < RATE_WINDOW_MS)
      : [];

    if (recent.length >= maxAllowed) {
      return false;
    }

    recent.push(now);
    tx.set(ref, { timestamps: recent, updatedAtMs: now }, { merge: true });
    return true;
  });
}

exports.dawayaAiProxy = onRequest(
  { secrets: [GEMINI_API_KEY], cors: true, maxInstances: 20, timeoutSeconds: 30 },
  async (req, res) => {
    const reqPath = req.path || req.url || '';

    // 1. Safe non-sensitive readiness health endpoint (/api/ai/status)
    if (req.method === 'GET' && reqPath.includes('/status')) {
      const secretVal = (process.env.GEMINI_API_KEY || '').trim();
      return res.status(200).json({
        configured: Boolean(secretVal && secretVal.length > 10),
        provider: 'dawaya_server_proxy',
        allowedModels: Array.from(ALLOWED_MODELS),
        medicalDisclaimerRequired: true,
        maxTextChars: MAX_TEXT_CHARS,
      });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    }

    // 2. Verify Firebase App Check token when present or enforced
    const appCheckToken = req.headers['x-firebase-appcheck'];
    if (process.env.ENFORCE_APP_CHECK === 'true') {
      if (!appCheckToken) {
        return res.status(401).json({ error: 'APP_CHECK_TOKEN_REQUIRED' });
      }
      try {
        await admin.appCheck().verifyToken(String(appCheckToken));
      } catch {
        return res.status(401).json({ error: 'INVALID_APP_CHECK_TOKEN' });
      }
    }

    // 3. Authenticate Firebase User ID Token
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'AUTHENTICATION_REQUIRED' });
    }
    const idToken = authHeader.slice(7).trim();
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch {
      return res.status(401).json({ error: 'INVALID_AUTH_TOKEN' });
    }

    // 4. Shared Distributed Rate Limiting (Per-UID and Per-IP across all instances)
    const forwardedFor = String(req.headers['x-forwarded-for'] || req.ip || 'unknown_ip');
    const clientIp = forwardedFor.split(',')[0].trim();

    try {
      const [uidAllowed, ipAllowed] = await Promise.all([
        checkDistributedRateLimit(`uid_${decodedToken.uid}`, MAX_REQ_PER_UID_PER_MIN),
        checkDistributedRateLimit(`ip_${clientIp}`, MAX_REQ_PER_IP_PER_MIN),
      ]);
      if (!uidAllowed || !ipAllowed) {
        return res.status(429).json({ error: 'RATE_LIMIT_EXCEEDED' });
      }
    } catch {
      return res.status(503).json({ error: 'RATE_LIMIT_SERVICE_UNAVAILABLE' });
    }

    // 5. Validate input size, model allowlist & structure
    const body = req.body || {};
    const rawPrompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    if (!rawPrompt || rawPrompt.length > MAX_TEXT_CHARS) {
      return res.status(400).json({ error: 'INVALID_PROMPT_LENGTH' });
    }
    if (body.inlineImageBase64 && String(body.inlineImageBase64).length > MAX_BASE64_CHARS) {
      return res.status(413).json({ error: 'IMAGE_PAYLOAD_TOO_LARGE' });
    }

    const requestedModel = String(body.model || 'gemini-2.0-flash');
    const model = ALLOWED_MODELS.has(requestedModel) ? requestedModel : 'gemini-2.0-flash';

    const secretKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!secretKey) {
      return res.status(503).json({ error: 'AI_SERVICE_NOT_CONFIGURED_ON_SERVER' });
    }

    // 6. Redact PII and call upstream provider exclusively from server side with timeout
    const sanitizedPrompt = sanitizePromptPii(rawPrompt);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);

    try {
      const parts = [{ text: sanitizedPrompt }];
      if (body.inlineImageBase64 && body.mimeType) {
        parts.push({
          inlineData: {
            mimeType: String(body.mimeType),
            data: String(body.inlineImageBase64),
          },
        });
      }

      const upstreamResp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': secretKey,
          },
          signal: ctrl.signal,
          body: JSON.stringify({
            systemInstruction: {
              parts: [
                {
                  text: 'تنبيه سلامة طبية صارم: أنت مساعد تثقيفي دوائي فقط. لا تقدم تشخيصاً طبياً نهائياً ولا تصف أدوية بديلة دون مراجعة الطبيب أو الصيدلي المرخص.',
                },
              ],
            },
            contents: [{ role: 'user', parts }],
            generationConfig: {
              temperature: 0.15,
              maxOutputTokens: 900,
            },
          }),
        }
      );
      clearTimeout(timer);

      if (!upstreamResp.ok) {
        return res.status(502).json({ error: 'UPSTREAM_AI_UNAVAILABLE' });
      }
      const data = await upstreamResp.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return res.status(200).json({
        text,
        safetyDisclaimer: 'هذه المعلومات إرشادية وتثقيفية ولا تغني عن استشارة الطبيب أو الصيدلي.',
      });
    } catch {
      clearTimeout(timer);
      return res.status(504).json({ error: 'UPSTREAM_AI_TIMEOUT_OR_ERROR' });
    }
  }
);
