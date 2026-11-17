/**
 * Cloudflare Pages Function (100% Free Tier - 100,000 req/day)
 * Endpoint: POST /api/ai/generate
 * Uses current 2026 Free-Tier Gemini models (gemini-3.8-flash, gemini-3.6-flash, gemini-3.5-flash-lite)
 * AND dynamically discovers available models via /v1beta/models if any model returns 404!
 */
const ipWindowMap = new Map();
const MAX_REQ_PER_IP_PER_MIN = 30;

function checkEdgeRateLimit(ip) {
  const now = Date.now();
  const prev = ipWindowMap.get(ip) || [];
  const recent = prev.filter((t) => now - t < 60000);
  if (recent.length >= MAX_REQ_PER_IP_PER_MIN) return false;
  recent.push(now);
  ipWindowMap.set(ip, recent);
  return true;
}

function sanitizeEdgePromptPii(rawText) {
  return String(rawText || '')
    .replace(/\b[0-9\u0660-\u0669]{14}\b/g, '[REDACTED_NATIONAL_ID]')
    .replace(/\b(?:\+?20|0)?1[0125][0-9\u0660-\u0669]{8}\b/g, '[REDACTED_PHONE]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[REDACTED_EMAIL]')
    .replace(/(?:اسم المريض|المريض|Patient Name|Name)\s*[:：-]\s*[^\n،,.]{2,40}/gi, '[REDACTED_PATIENT_NAME]');
}

async function discoverAvailableFlashModels(key) {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`,
      { headers: { 'x-goog-api-key': key } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const list = Array.isArray(data?.models) ? data.models : [];
    const usable = list
      .filter(
        (m) =>
          Array.isArray(m.supportedGenerationMethods) &&
          m.supportedGenerationMethods.includes('generateContent') &&
          /gemini/i.test(m.name || '') &&
          !/embedding|tts|imagen|veo|audio/i.test(m.name || '')
      )
      .map((m) => String(m.name || '').replace(/^models\//, ''));
    // Prefer flash models first
    usable.sort((a, b) => {
      const aFlash = /flash/i.test(a) ? 0 : 1;
      const bFlash = /flash/i.test(b) ? 0 : 1;
      return aFlash - bFlash;
    });
    return usable.slice(0, 5);
  } catch {
    return [];
  }
}

export async function onRequestPost(context) {
  const key = (context.env && context.env.GEMINI_API_KEY ? String(context.env.GEMINI_API_KEY) : '').trim();
  if (!key || key.length < 15) {
    return new Response(JSON.stringify({ error: 'AI_KEY_NOT_CONFIGURED' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const clientIp =
    context.request.headers.get('CF-Connecting-IP') ||
    context.request.headers.get('x-forwarded-for') ||
    'unknown';

  if (!checkEdgeRateLimit(clientIp)) {
    return new Response(JSON.stringify({ error: 'RATE_LIMIT_EXCEEDED' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await context.request.json();
    const rawPrompt = String(body?.prompt || '').slice(0, 12000);
    if (!rawPrompt) {
      return new Response(JSON.stringify({ error: 'EMPTY_PROMPT' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cleanPrompt = sanitizeEdgePromptPii(rawPrompt);
    const parts = [{ text: cleanPrompt }];

    if (body?.inlineImageBase64 && typeof body.inlineImageBase64 === 'string') {
      parts.push({
        inline_data: {
          mime_type: body.mimeType || 'image/jpeg',
          data: body.inlineImageBase64.slice(0, 5500000),
        },
      });
    }

    const candidateModels = [
      'gemini-3.8-flash',
      'gemini-3.6-flash',
      'gemini-3.5-flash-lite',
      'gemini-3-flash-preview',
      'gemini-2.5-flash',
    ];

    let lastStatus = 502;
    let lastErrorBody = '';
    const tried = new Set();

    const tryModel = async (model) => {
      if (tried.has(model)) return null;
      tried.add(model);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
      const upstream = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': key,
        },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { temperature: 0.15, maxOutputTokens: 1400 },
        }),
      });
      if (upstream.ok) {
        const data = await upstream.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return { text: String(text).trim(), model };
      }
      lastStatus = upstream.status;
      lastErrorBody = await upstream.text().catch(() => '');
      return null;
    };

    for (const model of candidateModels) {
      const ok = await tryModel(model);
      if (ok) {
        return new Response(JSON.stringify(ok), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (lastStatus !== 404 && lastStatus !== 400 && lastStatus !== 429) {
        break;
      }
    }

    // Dynamic model discovery fallback if hardcoded names returned 404
    if (lastStatus === 404) {
      const dynamicModels = await discoverAvailableFlashModels(key);
      for (const dm of dynamicModels) {
        const ok = await tryModel(dm);
        if (ok) {
          return new Response(JSON.stringify(ok), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        error: 'UPSTREAM_AI_ERROR',
        status: lastStatus,
        detail: lastErrorBody.slice(0, 220),
      }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch {
    return new Response(JSON.stringify({ error: 'INTERNAL_EDGE_ERROR' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
