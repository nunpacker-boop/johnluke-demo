/**
 * Cloudflare Pages Function: /api/session
 *
 * Manages per-visitor curation sessions backed by Cloudflare KV (JL_SESSIONS).
 * Each visitor gets a UUID cookie identifying their session.
 * Their curation overrides are stored in KV and merged over canonical data
 * at read time — the Neo4j database is never written to.
 *
 * Session data shape stored in KV under key `session:{uuid}`:
 * {
 *   createdAt: ISO string,
 *   updatedAt: ISO string,
 *   timelineOverrides: { "artwork-jl-001": false, "artwork-jl-012": false, ... },
 *   annotations:       { "artwork-jl-001": "My note about this work", ... },
 *   collections:       [ { id: uuid, name: "My collection", artworkIds: [...] } ],
 * }
 *
 * GET  /api/session              — return current session data (creates if new)
 * PATCH /api/session             — update session data (merge, not replace)
 * DELETE /api/session            — clear all session overrides (reset to default)
 *
 * Cookie: jl_session_id (HttpOnly, SameSite=Lax, 1 year expiry)
 * KV TTL: 1 year (31536000 seconds)
 */

const COOKIE_NAME = "jl_session_id";
const KV_TTL      = 60 * 60 * 24 * 365; // 1 year in seconds
const SESSION_TTL = 60 * 60 * 24 * 365 * 1000; // 1 year in ms

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin":      origin || "*",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods":     "GET, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":     "Content-Type",
    "Content-Type": "application/json",
  };
}

function generateUUID() {
  // Cloudflare Workers supports crypto.randomUUID()
  return crypto.randomUUID();
}

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach(part => {
    const [k, ...v] = part.trim().split("=");
    if (k) cookies[k.trim()] = decodeURIComponent(v.join("="));
  });
  return cookies;
}

function makeSessionCookie(uuid, isNew) {
  const expires = new Date(Date.now() + SESSION_TTL).toUTCString();
  return `${COOKIE_NAME}=${uuid}; Path=/; Expires=${expires}; SameSite=Lax`;
}

function emptySession() {
  return {
    createdAt:         new Date().toISOString(),
    updatedAt:         new Date().toISOString(),
    timelineOverrides: {},   // artworkId -> boolean (false = hidden)
    annotations:       {},   // artworkId -> string
    collections:       [],   // [ { id, name, artworkIds[] } ]
  };
}

// ── GET — return session, create if new ──────────────────────────────────────
export async function onRequestGet({ request, env }) {
  const origin = request.headers.get("Origin");
  const headers = corsHeaders(origin);

  if (!env.JL_SESSIONS) {
    return new Response(
      JSON.stringify({ error: "KV namespace JL_SESSIONS not bound", session: emptySession() }),
      { status: 200, headers }
    );
  }

  const cookies  = parseCookies(request.headers.get("Cookie"));
  let   uuid     = cookies[COOKIE_NAME];
  let   isNew    = false;
  let   session;

  if (!uuid || !/^[0-9a-f-]{36}$/.test(uuid)) {
    uuid    = generateUUID();
    isNew   = true;
    session = emptySession();
    await env.JL_SESSIONS.put(`session:${uuid}`, JSON.stringify(session), { expirationTtl: KV_TTL });
  } else {
    const raw = await env.JL_SESSIONS.get(`session:${uuid}`);
    if (!raw) {
      isNew   = true;
      session = emptySession();
      await env.JL_SESSIONS.put(`session:${uuid}`, JSON.stringify(session), { expirationTtl: KV_TTL });
    } else {
      session = JSON.parse(raw);
    }
  }

  const responseHeaders = { ...headers };
  if (isNew) responseHeaders["Set-Cookie"] = makeSessionCookie(uuid);

  return new Response(
    JSON.stringify({ uuid, isNew, session }),
    { status: 200, headers: responseHeaders }
  );
}

// ── PATCH — merge updates into session ───────────────────────────────────────
export async function onRequestPatch({ request, env }) {
  const origin  = request.headers.get("Origin");
  const headers = corsHeaders(origin);

  if (request.method === "OPTIONS") return new Response(null, { headers });

  if (!env.JL_SESSIONS) {
    return new Response(JSON.stringify({ error: "KV not bound" }), { status: 503, headers });
  }

  const cookies = parseCookies(request.headers.get("Cookie"));
  const uuid    = cookies[COOKIE_NAME];

  if (!uuid || !/^[0-9a-f-]{36}$/.test(uuid)) {
    return new Response(JSON.stringify({ error: "No valid session cookie" }), { status: 400, headers });
  }

  let body;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers });
  }

  const raw = await env.JL_SESSIONS.get(`session:${uuid}`);
  const session = raw ? JSON.parse(raw) : emptySession();

  // Merge timelineOverrides
  if (body.timelineOverrides && typeof body.timelineOverrides === "object") {
    session.timelineOverrides = { ...session.timelineOverrides, ...body.timelineOverrides };
    // Clean up — remove entries that are `true` (true is the default, no need to store)
    Object.keys(session.timelineOverrides).forEach(k => {
      if (session.timelineOverrides[k] === true) delete session.timelineOverrides[k];
    });
  }

  // Merge annotations
  if (body.annotations && typeof body.annotations === "object") {
    session.annotations = { ...session.annotations, ...body.annotations };
    // Remove blank annotations
    Object.keys(session.annotations).forEach(k => {
      if (!session.annotations[k]) delete session.annotations[k];
    });
  }

  // Replace collections if provided
  if (Array.isArray(body.collections)) {
    session.collections = body.collections;
  }

  session.updatedAt = new Date().toISOString();

  await env.JL_SESSIONS.put(`session:${uuid}`, JSON.stringify(session), { expirationTtl: KV_TTL });

  return new Response(JSON.stringify({ ok: true, session }), { headers });
}

// ── DELETE — reset session to defaults ───────────────────────────────────────
export async function onRequestDelete({ request, env }) {
  const origin  = request.headers.get("Origin");
  const headers = corsHeaders(origin);

  if (!env.JL_SESSIONS) {
    return new Response(JSON.stringify({ error: "KV not bound" }), { status: 503, headers });
  }

  const cookies = parseCookies(request.headers.get("Cookie"));
  const uuid    = cookies[COOKIE_NAME];

  if (!uuid || !/^[0-9a-f-]{36}$/.test(uuid)) {
    return new Response(JSON.stringify({ error: "No session" }), { status: 400, headers });
  }

  const fresh = emptySession();
  await env.JL_SESSIONS.put(`session:${uuid}`, JSON.stringify(fresh), { expirationTtl: KV_TTL });

  return new Response(JSON.stringify({ ok: true, session: fresh }), { headers });
}

// ── OPTIONS preflight ─────────────────────────────────────────────────────────
export async function onRequestOptions({ request }) {
  const origin = request.headers.get("Origin");
  return new Response(null, { headers: corsHeaders(origin) });
}
