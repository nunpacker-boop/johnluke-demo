/**
 * Cloudflare Pages Function: /api/search
 *
 * Confirmed schema:
 *   (:Artwork)   props: title, medium, dateText, yearFrom, yearTo,
 *                       currentLocation, dimensionsText, legacyRef, notes, slug
 *   (:Artwork)-[:USES_TECHNIQUE]->(:Technique)  — t.name
 *   (:Artwork)-[:CREATED_IN]->(:Period)          — p.name
 *   (:Artwork)-[:HOUSED_AT]->(:Institution)
 *   (:Exhibition)-[:INCLUDES_ARTWORK]->(:Artwork)
 *   (:Exhibition) props: title, yearText, exhibitionType, catalogue
 *
 * Env vars (Cloudflare Pages → Settings → Environment Variables):
 *   NEO4J_URI       neo4j+s://133c784a.databases.neo4j.io
 *   NEO4J_USER      neo4j
 *   NEO4J_PASSWORD  your-password
 */

export async function onRequestGet({ request, env }) {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (request.method === "OPTIONS") return new Response(null, { headers: cors });

  // ── Env check ──────────────────────────────────────────────────────────────
  if (!env.NEO4J_URI || !env.NEO4J_USER || !env.NEO4J_PASSWORD) {
    return new Response(
      JSON.stringify({ error: "Database not configured. Set NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD in Cloudflare Pages environment variables." }),
      { status: 503, headers: cors }
    );
  }

  // ── Params ─────────────────────────────────────────────────────────────────
  const url      = new URL(request.url);
  const q        = (url.searchParams.get("q") || "").trim();
  const type     = url.searchParams.get("type") || "all";
  const dateFrom = url.searchParams.get("from") ? parseFloat(url.searchParams.get("from")) : null;
  const dateTo   = url.searchParams.get("to")   ? parseFloat(url.searchParams.get("to"))   : null;
  const limit    = Math.min(parseInt(url.searchParams.get("limit") || "24"), 60);

  if (!q && !dateFrom && !dateTo) {
    return new Response(JSON.stringify({ error: "No query provided", results: [] }), { status: 400, headers: cors });
  }

  // ── Cypher ─────────────────────────────────────────────────────────────────
  // Common RETURN block — reused across all query types
  const RETURN_BLOCK = `
    RETURN DISTINCT
      w.title           AS title,
      w.dateText        AS dateText,
      w.yearFrom        AS yearFrom,
      w.yearTo          AS yearTo,
      w.medium          AS medium,
      w.legacyRef       AS legacyRef,
      w.currentLocation AS location,
      w.dimensionsText  AS dimensions,
      w.slug            AS slug,
      t.name            AS technique,
      p.name            AS period,
      collect(DISTINCT e.title)[0..3] AS exhibitions
    ORDER BY w.yearFrom ASC, w.title ASC
    LIMIT $limit
  `;

  // Common optional matches — always needed for RETURN_BLOCK
  const OPTIONAL = `
    OPTIONAL MATCH (w)-[:USES_TECHNIQUE]->(t:Technique)
    OPTIONAL MATCH (w)-[:CREATED_IN]->(p:Period)
    OPTIONAL MATCH (e:Exhibition)-[:INCLUDES_ARTWORK]->(w)
  `;

  let cypher = "";
  const params = { limit };

  if (type === "exhibition") {
    // Search by exhibition title — return works in matching exhibitions
    params.q = q.toLowerCase();
    cypher = `
      MATCH (e:Exhibition)-[:INCLUDES_ARTWORK]->(w:Artwork)
      WHERE toLower(e.title)         CONTAINS $q
         OR toLower(e.exhibitionType) CONTAINS $q
         OR toLower(e.yearText)       CONTAINS $q
      OPTIONAL MATCH (w)-[:USES_TECHNIQUE]->(t:Technique)
      OPTIONAL MATCH (w)-[:CREATED_IN]->(p:Period)
      WITH w, t, p, collect(DISTINCT e.title)[0..3] AS exhibitions
      RETURN DISTINCT
        w.title           AS title,
        w.dateText        AS dateText,
        w.yearFrom        AS yearFrom,
        w.yearTo          AS yearTo,
        w.medium          AS medium,
        w.legacyRef       AS legacyRef,
        w.currentLocation AS location,
        w.dimensionsText  AS dimensions,
        w.slug            AS slug,
        t.name            AS technique,
        p.name            AS period,
        exhibitions
      ORDER BY w.yearFrom ASC, w.title ASC
      LIMIT $limit
    `;

  } else if (type === "medium") {
    params.q = q.toLowerCase();
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo)   params.dateTo   = dateTo;
    const dateFilter = [
      dateFrom ? "w.yearFrom >= $dateFrom" : null,
      dateTo   ? "w.yearTo <= $dateTo"     : null,
    ].filter(Boolean).join(" AND ");

    cypher = `
      MATCH (w:Artwork)
      ${OPTIONAL}
      WHERE (toLower(w.medium) CONTAINS $q OR toLower(t.name) CONTAINS $q)
      ${dateFilter ? "AND " + dateFilter : ""}
      ${RETURN_BLOCK}
    `;

  } else if (type === "period") {
    params.q = q.toLowerCase();
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo)   params.dateTo   = dateTo;
    const dateFilter = [
      dateFrom ? "w.yearFrom >= $dateFrom" : null,
      dateTo   ? "w.yearTo <= $dateTo"     : null,
    ].filter(Boolean).join(" AND ");

    cypher = `
      MATCH (w:Artwork)
      ${OPTIONAL}
      WHERE toLower(p.name) CONTAINS $q
      ${dateFilter ? "AND " + dateFilter : ""}
      ${RETURN_BLOCK}
    `;

  } else {
    // "all" or "title"
    const termClauses = [];
    if (q) {
      params.q = q.toLowerCase();
      termClauses.push("toLower(w.title) CONTAINS $q");
      termClauses.push("toLower(w.notes) CONTAINS $q");
      if (type === "all") {
        termClauses.push("toLower(w.medium) CONTAINS $q");
        termClauses.push("toLower(t.name) CONTAINS $q");
        termClauses.push("toLower(p.name) CONTAINS $q");
      }
    }
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo)   params.dateTo   = dateTo;

    const dateFilter = [
      dateFrom ? "w.yearFrom >= $dateFrom" : null,
      dateTo   ? "w.yearTo <= $dateTo"     : null,
    ].filter(Boolean).join(" AND ");

    const whereClause = termClauses.length && dateFilter
      ? `WHERE (${termClauses.join(" OR ")}) AND ${dateFilter}`
      : termClauses.length
        ? `WHERE (${termClauses.join(" OR ")})`
        : dateFilter
          ? `WHERE ${dateFilter}`
          : "";

    cypher = `
      MATCH (w:Artwork)
      ${OPTIONAL}
      ${whereClause}
      ${RETURN_BLOCK}
    `;
  }

  // ── Connect to Neo4j ───────────────────────────────────────────────────────
  const host = env.NEO4J_URI
    .replace(/^neo4j\+s:\/\//, "https://")
    .replace(/^neo4j:\/\//, "http://")
    .replace(/\/$/, "");
  const endpoint    = `${host}/db/neo4j/query/v2`;
  const credentials = btoa(`${env.NEO4J_USER}:${env.NEO4J_PASSWORD}`);

  let raw;
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/json",
        "Accept":        "application/json",
      },
      body: JSON.stringify({ statement: cypher, parameters: params }),
    });
    raw = await res.text();
    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: `Neo4j ${res.status}`, details: raw.slice(0, 500) }),
        { status: 200, headers: cors }
      );
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Connection failed: ${err.message}` }),
      { status: 200, headers: cors }
    );
  }

  // ── Parse & shape results ──────────────────────────────────────────────────
  let data;
  try { data = JSON.parse(raw); }
  catch (e) {
    return new Response(
      JSON.stringify({ error: "Invalid JSON from Neo4j", details: raw.slice(0, 200) }),
      { status: 200, headers: cors }
    );
  }

  const fields  = data?.data?.fields || [];
  const rows    = data?.data?.values || [];
  const results = rows.map(row => {
    const obj = {};
    fields.forEach((f, i) => { obj[f] = row[i]; });
    return obj;
  });

  return new Response(
    JSON.stringify({ query: q, type, count: results.length, results }),
    { status: 200, headers: cors }
  );
}
