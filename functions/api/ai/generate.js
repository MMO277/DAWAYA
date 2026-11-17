/**
 * Cloudflare Pages Function (100% Free Tier)
 * Endpoint: POST /api/ai/generate
 * Supports:
 * 1. Google Gemini API Key (AIza...) with automatic live model discovery via /v1beta/models
 *    + Native Image Vision + Native Direct Audio Understanding (no Google Speech popup needed).
 * 2. Cloudflare Workers AI native binding (context.env.AI -> Llama 3.2 Vision / Whisper Audio / Llama 3.1).
 * 3. Groq API Key (gsk_... -> Llama 4 Scout Vision / Whisper Audio / Llama 3.3).
 */
const ipWindowMap = new Map();
const MAX_REQ_PER_IP_PER_MIN = 35;
let cachedDiscoveredModels = null;
let cachedModelsTimestamp = 0;

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

function sanitizeProfanityOutput(text) {
  const s = String(text || '');
  const badWordsPattern =
    /\b(fuck|shit|bitch|asshole|bastard|dick|pussy|whore|slut|cunt|motherfucker|كسمك|كس امك|ابن الكلب|ابن الوسخة|يا وسخ|يا شرموط|شرموطة|عرص|خول|متناك|منيوك|يلعن دين|قحبة)\b/gi;
  return s.replace(badWordsPattern, '***');
}

async function discoverGoogleModels(apiKey, preferAudio = false) {
  const now = Date.now();
  if (!preferAudio && cachedDiscoveredModels && cachedDiscoveredModels.length > 0 && now - cachedModelsTimestamp < 600000) {
    return cachedDiscoveredModels;
  }
  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`
    );
    if (!resp.ok) return [];
    const data = await resp.json();
    const list = Array.isArray(data?.models) ? data.models : [];
    const usable = list
      .filter((m) => {
        const methods = Array.isArray(m?.supportedGenerationMethods) ? m.supportedGenerationMethods : [];
        if (!methods.includes('generateContent')) return false;
        const id = String(m?.name || '').replace(/^models\//, '').toLowerCase();
        if (!id) return false;
        if (
          id.includes('embedding') ||
          id.includes('imagen') ||
          id.includes('veo') ||
          id.includes('tts') ||
          id.includes('aqa') ||
          id.includes('bisect') ||
          id.includes('thinking-exp') ||
          id.includes('robotics')
        ) {
          return false;
        }
        // Skip audio-only native-audio-dialog models unless requested; standard Gemini Flash handles audio input natively
        if (id.includes('native-audio')) return false;
        return true;
      })
      .map((m) => String(m.name).replace(/^models\//, ''));

    const scoreModel = (id) => {
      const lower = id.toLowerCase();
      if (lower === 'gemini-2.0-flash' || lower === 'gemini-2.0-flash-001') return -50;
      if (lower === 'gemini-2.5-flash') return -20;
      let score = 0;
      if (lower.includes('gemini-3')) score += 100;
      if (lower.includes('flash-lite')) score += 90;
      if (lower.includes('gemini-2.5-flash-lite')) score += 95;
      if (lower.includes('gemini-2.5-flash-preview')) score += 80;
      if (lower.includes('flash')) score += 60;
      // Gemma 3 doesn't support inline audio input well, so rank Gemini Flash above Gemma when audio is present
      if (preferAudio && lower.includes('gemma')) score -= 80;
      if (lower.includes('gemma-3-27b-it')) score += 75;
      if (lower.includes('gemma-3-12b-it')) score += 70;
      if (lower.includes('pro')) score += 40;
      if (lower.includes('latest')) score += 25;
      return score;
    };

    usable.sort((a, b) => scoreModel(b) - scoreModel(a));
    if (!preferAudio && usable.length > 0) {
      cachedDiscoveredModels = usable;
      cachedModelsTimestamp = now;
    }
    return usable;
  } catch {
    return [];
  }
}

async function transcribeAudioWithCloudflare(aiBinding, audioBase64) {
  try {
    const binaryString = atob(audioBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const res = await aiBinding.run('@cf/openai/whisper', {
      audio: Array.from(bytes),
    });
    return String(res?.text || '').trim();
  } catch {
    return '';
  }
}

async function callCloudflareWorkersAi(aiBinding, cleanPrompt, inlineImageBase64, inlineAudioBase64) {
  try {
    const hasImage = Boolean(inlineImageBase64 && typeof inlineImageBase64 === 'string');
    const hasAudio = Boolean(inlineAudioBase64 && typeof inlineAudioBase64 === 'string');

    let effectivePrompt = cleanPrompt;
    let transcript = '';
    if (hasAudio) {
      transcript = await transcribeAudioWithCloudflare(aiBinding, inlineAudioBase64);
      if (transcript) {
        effectivePrompt = `${cleanPrompt}\n\n[كلام المستخدم المسجل صوتياً]: "${transcript}"`;
      }
    }

    if (hasImage) {
      const binaryString = atob(inlineImageBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const response = await aiBinding.run('@cf/meta/llama-3.2-11b-vision-instruct', {
        prompt: effectivePrompt,
        image: Array.from(bytes),
        max_tokens: 1400,
      });
      const text = response?.response || response?.result?.response || '';
      if (text) return { ok: true, text: sanitizeProfanityOutput(String(text).trim()), model: '@cf/meta/llama-3.2-11b-vision-instruct', transcript };
    } else {
      const response = await aiBinding.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          {
            role: 'system',
            content: 'أنت مساعد ذكي ومنفتح ومحترم جداً، تجيب على جميع الأسئلة بحرية وود باللهجة المصرية أو لغة المستخدم، وتمنع تماماً أي شتائم أو ألفاظ نابية.',
          },
          { role: 'user', content: effectivePrompt },
        ],
        max_tokens: 1400,
      });
      const text = response?.response || response?.result?.response || '';
      if (text) return { ok: true, text: sanitizeProfanityOutput(String(text).trim()), model: '@cf/meta/llama-3.1-8b-instruct', transcript };
    }
  } catch {
    // Fallback to next provider
  }
  return { ok: false };
}

async function callGroqVisionOrText(groqKey, cleanPrompt, inlineImageBase64, mimeType, inlineAudioBase64, audioMimeType) {
  const hasImage = Boolean(inlineImageBase64 && typeof inlineImageBase64 === 'string');
  const hasAudio = Boolean(inlineAudioBase64 && typeof inlineAudioBase64 === 'string');

  let effectivePrompt = cleanPrompt;
  let transcript = '';

  if (hasAudio) {
    try {
      const binaryString = atob(inlineAudioBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const ext = (audioMimeType || 'audio/webm').includes('mp4') ? 'm4a' : (audioMimeType || '').includes('wav') ? 'wav' : 'webm';
      const formData = new FormData();
      formData.append('file', new Blob([bytes], { type: audioMimeType || 'audio/webm' }), `voice.${ext}`);
      formData.append('model', 'whisper-large-v3-turbo');
      const trResp = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${groqKey}` },
        body: formData,
      });
      if (trResp.ok) {
        const trData = await trResp.json();
        transcript = String(trData?.text || '').trim();
        if (transcript) {
          effectivePrompt = `${cleanPrompt}\n\n[كلام المستخدم المسجل صوتياً]: "${transcript}"`;
        }
      }
    } catch {
      // Continue
    }
  }

  const candidateModels = hasImage
    ? [
        'meta-llama/llama-4-scout-17b-16e-instruct',
        'meta-llama/llama-4-maverick-17b-128e-instruct',
      ]
    : [
        'llama-3.3-70b-versatile',
        'meta-llama/llama-4-scout-17b-16e-instruct',
      ];

  let lastStatus = 502;
  let lastErrorBody = '';

  for (const model of candidateModels) {
    const content = hasImage
      ? [
          { type: 'text', text: effectivePrompt },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType || 'image/jpeg'};base64,${inlineImageBase64.slice(0, 5200000)}`,
            },
          },
        ]
      : effectivePrompt;

    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'أنت مساعد ذكي ومنفتح ومحترم جداً، ترد على جميع الأسئلة بحرية وذكاء باللهجة المصرية أو لغة المستخدم، وتلتزم تماماً بمنع أي شتائم أو ألفاظ نابية.',
          },
          { role: 'user', content },
        ],
        temperature: 0.25,
        max_completion_tokens: 1500,
      }),
    });

    if (resp.ok) {
      const data = await resp.json();
      const text = data?.choices?.[0]?.message?.content || '';
      return { ok: true, text: sanitizeProfanityOutput(String(text).trim()), model, transcript };
    }
    lastStatus = resp.status;
    lastErrorBody = await resp.text().catch(() => '');
  }

  return { ok: false, status: lastStatus, detail: lastErrorBody };
}

export async function onRequestPost(context) {
  const groqEnv = (context.env?.GROQ_API_KEY ? String(context.env.GROQ_API_KEY) : '').trim();
  const geminiEnv = (context.env?.GEMINI_API_KEY ? String(context.env.GEMINI_API_KEY) : '').trim();
  const aiBinding = context.env?.AI || null;
  const key = groqEnv || geminiEnv;

  if ((!key || key.length < 15) && !aiBinding) {
    return new Response(JSON.stringify({ error: 'AI_KEY_NOT_CONFIGURED' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const clientIp =
    context.request.headers.get('CF-Connecting-IP') ||
    context.request.headers.get('x-forwarded-for') ||
    'unknown';

  if (!checkEdgeRateLimit(clientIp)) {
    return new Response(JSON.stringify({ error: 'RATE_LIMIT_EXCEEDED' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const body = await context.request.json();
    const hasAudio = Boolean(body?.inlineAudioBase64 && typeof body.inlineAudioBase64 === 'string');
    const rawPrompt = String(body?.prompt || (hasAudio ? 'اسمع التسجيل الصوتي ده، افهم كلام المستخدم بالعامية المصرية أو لغته، ورد عليه مباشرة.' : '')).slice(0, 12000);
    if (!rawPrompt && !hasAudio) {
      return new Response(JSON.stringify({ error: 'EMPTY_PROMPT' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const cleanPrompt = sanitizeEdgePromptPii(rawPrompt);

    // 1. If the configured key is a Groq key (starts with gsk_), route to Groq
    const effectiveGroqKey = groqEnv.startsWith('gsk_')
      ? groqEnv
      : geminiEnv.startsWith('gsk_')
        ? geminiEnv
        : '';

    if (effectiveGroqKey) {
      const groqRes = await callGroqVisionOrText(
        effectiveGroqKey,
        cleanPrompt,
        body?.inlineImageBase64,
        body?.mimeType,
        body?.inlineAudioBase64,
        body?.audioMimeType
      );
      if (groqRes.ok) {
        return new Response(JSON.stringify({ text: groqRes.text, model: groqRes.model, transcript: groqRes.transcript || '' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }
    }

    // 2. If a Google Gemini key (AIza...) is configured, auto-discover enabled models
    const effectiveGeminiKey = !effectiveGroqKey && key && key.length >= 15 ? key : '';
    let lastStatus = 502;
    let lastErrorBody = '';

    if (effectiveGeminiKey) {
      const parts = [{ text: cleanPrompt }];
      if (body?.inlineImageBase64 && typeof body.inlineImageBase64 === 'string') {
        parts.push({
          inline_data: {
            mime_type: body.mimeType || 'image/jpeg',
            data: body.inlineImageBase64.slice(0, 5500000),
          },
        });
      }
      if (hasAudio) {
        parts.push({
          inline_data: {
            mime_type: body.audioMimeType || 'audio/webm',
            data: body.inlineAudioBase64.slice(0, 7500000),
          },
        });
      }

      const discovered = await discoverGoogleModels(effectiveGeminiKey, hasAudio);
      const fallbackModels = [
        'gemini-2.5-flash-lite',
        'gemini-2.5-flash-lite-preview-06-17',
        'gemini-3-flash-preview',
        'gemini-2.5-pro',
        'gemini-1.5-flash',
        'gemini-1.5-flash-latest',
        'gemini-2.5-flash',
      ];
      const candidateModels = Array.from(new Set([...discovered, ...fallbackModels])).slice(0, 10);

      for (const model of candidateModels) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(effectiveGeminiKey)}`;
        const upstream = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': effectiveGeminiKey,
          },
          body: JSON.stringify({
            contents: [{ parts }],
            safetySettings: [
              { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
              { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_LOW_AND_ABOVE' },
              { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
              { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
            ],
            generationConfig: { temperature: 0.25, maxOutputTokens: 2500 },
          }),
        });
        if (upstream.ok) {
          const data = await upstream.json();
          const rawParts = data?.candidates?.[0]?.content?.parts || [];
          const nonThought = rawParts.filter((p) => !p?.thought && typeof p?.text === 'string');
          const text = (nonThought.length > 0 ? nonThought : rawParts).map((p) => p?.text || '').join('\n').trim();
          if (text) {
            return new Response(JSON.stringify({ text: sanitizeProfanityOutput(String(text).trim()), model }), {
              status: 200,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            });
          }
        }
        lastStatus = upstream.status;
        lastErrorBody = await upstream.text().catch(() => '');
      }
    }

    // 3. Fallback to Cloudflare Workers AI native binding if attached (env.AI)
    if (aiBinding) {
      const cfRes = await callCloudflareWorkersAi(
        aiBinding,
        cleanPrompt,
        body?.inlineImageBase64,
        body?.inlineAudioBase64
      );
      if (cfRes.ok) {
        return new Response(JSON.stringify({ text: cfRes.text, model: cfRes.model, transcript: cfRes.transcript || '' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }
    }

    return new Response(
      JSON.stringify({
        error: 'UPSTREAM_AI_ERROR',
        status: lastStatus,
        detail: lastErrorBody.slice(0, 220),
      }),
      { status: 502, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  } catch {
    return new Response(JSON.stringify({ error: 'INTERNAL_EDGE_ERROR' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
