/**
 * Cloudflare Pages Function: /api/search
 *
 * Sits between the browser and Neo4j Aura.
 * Credentials never leave the server.
 *
 * Environment variables to set in Cloudflare Pages → Settings → Variables:
 *   NEO4J_URI      e.g.  https://abc123.databases.neo4j.io
 *   NEO4J_USER     e.g.  neo4j
 *   NEO4J_PASSWORD e.g.  your-password
 */

export async function onRequestGet({ request, env }) {
  // ── CORS headers (allow requests from your own domain) ──────────────────
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // ── Parse query params ──────────────────────────────────────────────────
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();
  const type = url.searchParams.get("type") || "all"; // title|medium|theme|exhibition|all
  const dateFrom = url.searchParams.get("from") || null;
  const dateTo = url.searchParams.get("to") || null;
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "24"), 60);

  if (!q && !dateFrom && !dateTo) {
    return new Response(
      JSON.stringify({ error: "No search query provided", results: [] }),
      { status: 400, headers: corsHeaders }
    );
  }

  // ── Build the Cypher query ───────────────────────────────────────────────
  // We build a single query that searches across whichever fields are relevant.
  // Neo4j Aura doesn't support full-text CONTAINS on all editions, so we use
  // toLower() string matching — fast enough for 215 works.

  const searchTerm = q.toLowerCase();

  let cypher = "";
  let params = { limit };

  if (type === "exhibition") {
    // Search by exhibition name → return works shown in that exhibition
    cypher = `
      MATCH (w:Artwork)-[:SHOWN_IN]->(e:Exhibition)
      WHERE toLower(e.name) CONTAINS $q
         OR toLower(e.venue) CONTAINS $q
      RETURN DISTINCT
        w.title        AS title,
        w.date         AS date,
        w.medium       AS medium,
        w.raison_number AS raisonneNumber,
        w.period       AS period,
        w.technique    AS technique,
        w.theme        AS theme,
        w.location     AS location,
        w.dimensions   AS dimensions,
        collect(e.name)[0..3] AS exhibitions
      ORDER BY w.date ASC
      LIMIT $limit
    `;
    params.q = searchTerm;

  } else {
    // General search across title, medium, theme, technique, period
    // with optional date range filter
    let whereClauses = [];

    if (q) {
      if (type === "title" || type === "all") {
        whereClauses.push("toLower(w.title) CONTAINS $q");
      }
      if (type === "medium" || type === "all") {
        whereClauses.push("toLower(w.medium) CONTAINS $q");
        whereClauses.push("toLower(w.technique) CONTAINS $q");
      }
      if (type === "theme" || type === "all") {
        whereClauses.push("toLower(w.theme) CONTAINS $q");
        whereClauses.push("toLower(w.subject) CONTAINS $q");
      }
      if (type === "period" || type === "all") {
        whereClauses.push("toLower(w.period) CONTAINS $q");
      }
      params.q = searchTerm;
    }

    let dateFilter = "";
    if (dateFrom) {
      dateFilter += " AND (w.year >= $dateFrom OR w.date >= $dateFrom)";
      params.dateFrom = dateFrom;
    }
    if (dateTo) {
      dateFilter += " AND (w.year <= $dateTo OR w.date <= $dateTo)";
      params.dateTo = dateTo;
    }

    const whereClause = whereClauses.length
      ? `WHERE (${whereClauses.join(" OR ")})${dateFilter}`
      : dateFilter
        ? `WHERE true${dateFilter}`
        : "";

    cypher = `
      MATCH (w:Artwork)
      OPTIONAL MATCH (w)-[:SHOWN_IN]->(e:Exhibition)
      ${whereClause}
      RETURN DISTINCT
        w.title          AS title,
        w.date           AS date,
        w.year           AS year,
        w.medium         AS medium,
        w.raison_number  AS raisonneNumber,
        w.period         AS period,
        w.technique      AS technique,
        w.theme          AS theme,
        w.subject        AS subject,
        w.location       AS location,
        w.dimensions     AS dimensions,
        w.attribution    AS attribution,
        collect(DISTINCT e.name)[0..3] AS exhibitions
      ORDER BY w.year ASC, w.title ASC
      LIMIT $limit
    `;
  }

  // ── Build Neo4j endpoint ─────────────────────────────────────────────────
  // Accept either neo4j+s://xxx.databases.neo4j.io  or  https://xxx.databases.neo4j.io
  const neo4jHost = env.NEO4J_URI
    .replace(/^neo4j\+s:\/\//, "https://")
    .replace(/^neo4j:\/\//, "http://")
    .replace(/\/$/, ""); // strip trailing slash
  const endpoint = `${neo4jHost}/db/neo4j/query/v2`;
  const credentials = btoa(`${env.NEO4J_USER}:${env.NEO4J_PASSWORD}`);

  // ── Validate env vars are present ───────────────────────────────────────
  if (!env.NEO4J_URI || !env.NEO4J_USER || !env.NEO4J_PASSWORD) {
    return new Response(
      JSON.stringify({ error: "Database not configured. Set NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD in Cloudflare Pages environment variables." }),
      { status: 503, headers: corsHeaders }
    );
  }

  let neo4jResponse;
  try {
    neo4jResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      // NOTE: Neo4j Query API uses "statement", not "cypher"
      body: JSON.stringify({ statement: cypher, parameters: params }),
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Database connection failed: ${err.message}. Check NEO4J_URI is correct (should start with https://, not neo4j+s://).` }),
      { status: 502, headers: corsHeaders }
    );
  }

  if (!neo4jResponse.ok) {
    const errorText = await neo4jResponse.text();
    return new Response(
      JSON.stringify({ error: `Neo4j returned ${neo4jResponse.status}`, details: errorText }),
      { status: 200, headers: corsHeaders } // return 200 so browser parses JSON not HTML
    );
  }

  const data = await neo4jResponse.json();

  // ── Transform Neo4j response into clean result objects ───────────────────
  // Neo4j Query API v2 returns { data: { fields: [...], values: [[...], ...] } }
  const fields = data?.data?.fields || [];
  const rows = data?.data?.values || [];

  const results = rows.map((row) => {
    const obj = {};
    fields.forEach((field, i) => {
      obj[field] = row[i];
    });
    return obj;
  });

  return new Response(
    JSON.stringify({
      query: q,
      type,
      count: results.length,
      results,
    }),
    { status: 200, headers: corsHeaders }
  );
}
