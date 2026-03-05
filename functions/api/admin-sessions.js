/**
 * Cloudflare Pages Function: /api/admin-sessions
 * Protected by Cloudflare Access.
 * Reads and manages KV sessions for the admin dashboard.
 */

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

export async function onRequestGet({ env }) {
  if (!env.JL_SESSIONS) {
    return new Response(JSON.stringify({ sessions: [], error: "KV not bound" }), { headers: CORS });
  }

  try {
    const list = await env.JL_SESSIONS.list({ prefix: "session:" });
    const sessions = await Promise.all(
      list.keys.map(async ({ name }) => {
        const raw = await env.JL_SESSIONS.get(name);
        if (!raw) return null;
        const session = JSON.parse(raw);
        return { uuid: name.replace("session:", ""), ...session };
      })
    );
    return new Response(
      JSON.stringify({ sessions: sessions.filter(Boolean) }),
      { headers: CORS }
    );
  } catch (e) {
    return new Response(JSON.stringify({ sessions: [], error: e.message }), { headers: CORS });
  }
}

export async function onRequestDelete({ request, env }) {
  if (!env.JL_SESSIONS) {
    return new Response(JSON.stringify({ error: "KV not bound" }), { status: 503, headers: CORS });
  }

  let body;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: CORS });
  }

  const { uuid } = body;
  if (!uuid) return new Response(JSON.stringify({ error: "No uuid" }), { status: 400, headers: CORS });

  await env.JL_SESSIONS.delete(`session:${uuid}`);
  return new Response(JSON.stringify({ ok: true }), { headers: CORS });
}
