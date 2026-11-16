/**
 * Cloudflare Pages Function (100% Free Tier - 100,000 req/day)
 * Endpoint: POST /api/ai/generate
 * Keeps GEMINI_API_KEY 100% hidden on the Cloudflare server edge, enforces per-IP rate limiting,
 * strips patient PII, and proxies prescription vision/text queries to Gemini 2.5 Flash.
 */
const ipWindowMap = new Map();
const MAX_REQ_PER_IP_PER_MIN = 25;

function checkEdgeRateLimit(ip) {
  const now = Date.now();
  const prev = ipWindowMap.get(ip) || [];
  const recent = prev.filter((t) => now - t < 60000);
  if (recent.length >= MAX_REQ_PER_IP_PER_MIN) {
    return false;
  }
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
    const model = body?.model === 'gemini-2.0-flash' ? 'gemini-2.0-flash' : 'gemini-2.5-flash';
    const parts = [{ text: cleanPrompt }];

    if (body?.inlineImageBase64 && typeof body.inlineImageBase64 === 'string') {
      parts.push({
        inline_data: {
          mime_type: body.mimeType || 'image/jpeg',
          data: body.inlineImageBase64.slice(0, 5500000),
        },
      });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { temperature: 0.15, maxOutputTokens: 1200 },
      }),
    });

    if (!upstream.ok) {
      return new Response(JSON.stringify({ error: 'UPSTREAM_AI_ERROR', status: upstream.status }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await upstream.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return new Response(JSON.stringify({ text: String(text).trim(), model }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'INTERNAL_EDGE_ERROR' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
