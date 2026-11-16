/**
 * Cloudflare Pages Function (100% Free Tier - 100,000 req/day)
 * Endpoint: GET /api/ai/status
 * Reports whether GEMINI_API_KEY is configured in Cloudflare Pages Environment Variables
 * without ever exposing the key to the browser.
 */
export async function onRequestGet(context) {
  const key = (context.env && context.env.GEMINI_API_KEY ? String(context.env.GEMINI_API_KEY) : '').trim();
  return new Response(
    JSON.stringify({
      configured: Boolean(key && key.length > 15),
      provider: 'cloudflare_pages_free_edge',
      allowedModels: ['gemini-2.5-flash', 'gemini-2.0-flash'],
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
