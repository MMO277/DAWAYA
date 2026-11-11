/**
 * DAWAYA Server-Side AI Proxy & Security Cloud Functions
 * Protects GEMINI_API_KEY inside Google Cloud Secret Manager / Server Environment.
 * Never exposes private AI provider keys or raw upstream errors to browser clients.
 */
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');

// Per-UID sliding window rate limiter (max 20 requests / 60s)
const uidCallTimestamps = new Map();
const MAX_REQ_PER_MIN = 20;
const MAX_TEXT_CHARS = 16000;
const MAX_BASE64_CHARS = 5500000; // ~4MB binary

function checkUidRateLimit(uid) {
  const now = Date.now();
  const prev = (uidCallTimestamps.get(uid) || []).filter((t) => now - t < 60000);
  if (prev.length >= MAX_REQ_PER_MIN) {
    return false;
  }
  prev.push(now);
  uidCallTimestamps.set(uid, prev);
  return true;
}

exports.dawayaAiProxy = onRequest(
  { secrets: [GEMINI_API_KEY], cors: true, maxInstances: 20, timeoutSeconds: 30 },
  async (req, res) => {
    const path = req.path || req.url || '';

    // 1. Safe non-sensitive readiness health endpoint (/api/ai/status)
    if (req.method === 'GET' && path.includes('/status')) {
      const secretVal = process.env.GEMINI_API_KEY || '';
      return res.status(200).json({
        configured: Boolean(secretVal && secretVal.length > 10),
        provider: 'dawaya_server_proxy',
        medicalDisclaimerRequired: true,
        maxTextChars: MAX_TEXT_CHARS,
      });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    }

    // 2. Authenticate Firebase User Token
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

    // 3. Enforce per-user rate limit
    if (!checkUidRateLimit(decodedToken.uid)) {
      return res.status(429).json({ error: 'RATE_LIMIT_EXCEEDED' });
    }

    // 4. Validate input size & structure
    const body = req.body || {};
    const promptText = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    if (!promptText || promptText.length > MAX_TEXT_CHARS) {
      return res.status(400).json({ error: 'INVALID_PROMPT_LENGTH' });
    }
    if (body.inlineImageBase64 && String(body.inlineImageBase64).length > MAX_BASE64_CHARS) {
      return res.status(413).json({ error: 'IMAGE_PAYLOAD_TOO_LARGE' });
    }

    const secretKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!secretKey) {
      return res.status(503).json({ error: 'AI_SERVICE_NOT_CONFIGURED_ON_SERVER' });
    }

    // 5. Call upstream provider exclusively from server side
    try {
      const model = body.model === 'gemini-2.5-flash' ? 'gemini-2.5-flash' : 'gemini-2.0-flash';
      const parts = [{ text: promptText }];
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
      return res.status(500).json({ error: 'INTERNAL_PROXY_ERROR' });
    }
  }
);
