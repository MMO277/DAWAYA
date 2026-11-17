/**
 * Cloudflare Pages Function (100% Free Tier)
 * Endpoint: GET /api/ai/status
 * Supports Google Gemini API keys, Groq API keys, and Cloudflare Workers AI binding.
 */
export async function onRequestGet(context) {
  const groqKey = (context.env?.GROQ_API_KEY ? String(context.env.GROQ_API_KEY) : '').trim();
  const geminiKey = (context.env?.GEMINI_API_KEY ? String(context.env.GEMINI_API_KEY) : '').trim();
  const hasCfAi = Boolean(context.env?.AI);
  const activeKey = groqKey || geminiKey;
  return new Response(
    JSON.stringify({
      configured: Boolean((activeKey && activeKey.length > 15) || hasCfAi),
      provider: activeKey.startsWith('gsk_')
        ? 'groq_llama4_vision'
        : hasCfAi && !activeKey
          ? 'cloudflare_workers_ai'
          : 'cloudflare_pages_free_edge',
      allowedModels: [
        'auto-discovered-gemini-vision',
        'meta-llama/llama-4-scout-17b-16e-instruct',
        '@cf/meta/llama-3.2-11b-vision-instruct',
      ],
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    }
  );
}
