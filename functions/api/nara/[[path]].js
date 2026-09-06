/**
 * Production AI proxy: Cloudflare Pages Function.
 *
 * Serves same-origin `POST /api/nara/*` by forwarding to Nara Router with
 * the server-side secret. The browser never sees the key:
 * - BYNARA_API_KEY is read from the Cloudflare project environment
 *   (Pages Settings → Variables and Secrets), never from client code.
 * - The key is only ever placed on the upstream Authorization header.
 * - Nothing secret is logged, echoed, or returned to the client.
 *
 * Any failure (missing secret, provider error, timeout) surfaces as a
 * non-2xx/empty response, which the assistant maps to its local fallback.
 * Only POST is accepted to keep the proxy surface minimal.
 */

const UPSTREAM_ORIGIN = 'https://router.bynara.id';
const UPSTREAM_TIMEOUT_MS = 25000;

function jsonResponse(payload, status) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const apiKey = env && env.BYNARA_API_KEY ? String(env.BYNARA_API_KEY) : '';
  if (!apiKey) {
    // No secret configured: client treats any failure as "AI unavailable".
    return jsonResponse({ error: 'AI unavailable' }, 503);
  }

  let upstreamUrl;
  let upstreamPath = '/';
  try {
    const url = new URL(request.url);
    upstreamPath = url.pathname.replace(/^\/api\/nara/, '') || '/';
    // Lock the proxy to the chat-completions API (no open proxy).
    if (!upstreamPath.startsWith('/v1/chat/completions')) {
      return jsonResponse({ error: 'Not found' }, 404);
    }
    upstreamUrl = new URL(upstreamPath + url.search, UPSTREAM_ORIGIN);
  } catch {
    return jsonResponse({ error: 'Bad request' }, 400);
  }

  let body;
  try {
    body = await request.arrayBuffer();
  } catch {
    return jsonResponse({ error: 'Bad request' }, 400);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const upstreamRes = await fetch(upstreamUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body,
      signal: controller.signal,
    });
    const text = await upstreamRes.text();
    return new Response(text, {
      status: upstreamRes.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return jsonResponse({ error: 'AI unavailable' }, 502);
  } finally {
    clearTimeout(timer);
  }
}
