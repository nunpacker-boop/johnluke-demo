/**
 * Cloudflare Pages Function: /api/search
 *
 * Schema:
 *   (:Artwork) props: title, medium, dateText, yearFrom, yearTo,
 *                     currentLocation, dimensionsText, legacyRef, slug,
 *                     artworkId, imageUrl, thumbnailUrl
 *   (:Artwork)-[:USES_TECHNIQUE]->(:Technique { name })
 *   (:Artwork)-[:CREATED_IN]->(:Period { name })
 *   (:Exhibition)-[:INCLUDES_ARTWORK]->(:Artwork)
 */

export async function onRequestGet({ request, env }) {
  const cors = {
    "Access-Control-Allow-Origin":  "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (request.method === "OPTIONS") return new Response(null, { headers: cors });

  if (!env.NEO4J_URI || !env.NEO4J_USER || !env.NEO4J_PASSWORD) {
    return new Response(
      JSON.stringify({ error: "Database not configured. Set NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD in Cloudflare Pages environment variables." }),
      { status: 503, headers: cors }
    );
  }

  const url      = new URL(request.url);
  const q        = (url.searchParams.get("q") || "").trim();
  const type     = url.searchParams.get("type") || "all";
  const dateFrom = url.searchParams.get("from") ? parseFloat(url.searchParams.get("from")) : null;
  const dateTo   = url.searchParams.get("to")   ? parseFloat(url.searchParams.get("to"))   : null;
  const limit    = Math.min(parseInt(url.searchParams.get("limit") || "24"), 60);

  if (!q && !dateFrom && !dateTo) {
    return new Response(JSON.stringify({ error: "No query provided", results: [] }), { status: 400, headers: cors });
  }

  const sq = q.toLowerCase();
  const params = { limit };

  // Date filter fragment
  const dateParts = [];
  if (dateFrom) { dateParts.push("w.yearFrom >= $dateFrom"); params.dateFrom = dateFrom; }
  if (dateTo)   { dateParts.push("w.yearTo   <= $dateTo");   params.dateTo   = dateTo; }
  const dateAnd = dateParts.length ? " AND " + dateParts.join(" AND ") : "";

  // ── Common RETURN block ───────────────────────────────────────────────────
  // Collects ALL techniques and ALL exhibitions per artwork — no duplicates.
  // yearFrom/yearTo cast to integer to strip the .0 float suffix.
  const RETURN_BLOCK = `
    WITH w,
      collect(DISTINCT t.name) AS techniques,
      collect(DISTINCT p.name) AS periods,
      collect(DISTINCT ex.title)[0..3] AS exhibitions
    RETURN
      w.title           AS title,
      w.dateText        AS dateText,
      toInteger(w.yearFrom) AS yearFrom,
      toInteger(w.yearTo)   AS yearTo,
      w.medium          AS medium,
      w.legacyRef       AS legacyRef,
      w.artworkId       AS artworkId,
      w.currentLocation AS location,
      w.dimensionsText  AS dimensions,
      w.slug            AS slug,
      w.imageUrl        AS imageUrl,
      w.thumbnailUrl    AS thumbnailUrl,
      techniques,
      periods,
      exhibitions
    ORDER BY w.yearFrom ASC, w.title ASC
    LIMIT $limit
  `;

  // ── Query shapes ──────────────────────────────────────────────────────────
  let cypher = "";

  if (type === "title") {
    params.q = sq;
    cypher = `
      MATCH (w:Artwork)
      WHERE toLower(w.title) CONTAINS $q ${dateAnd}
      OPTIONAL MATCH (w)-[:USES_TECHNIQUE]->(t:Technique)
      OPTIONAL MATCH (w)-[:CREATED_IN]->(p:Period)
      OPTIONAL MATCH (ex:Exhibition)-[:INCLUDES_ARTWORK]->(w)
      ${RETURN_BLOCK}
    `;

  } else if (type === "medium") {
    params.q = sq;
    // Match on medium property OR technique node — then collect all
    cypher = `
      MATCH (w:Artwork)
      WHERE toLower(w.medium) CONTAINS $q ${dateAnd}
      OPTIONAL MATCH (w)-[:USES_TECHNIQUE]->(t:Technique)
      OPTIONAL MATCH (w)-[:CREATED_IN]->(p:Period)
      OPTIONAL MATCH (ex:Exhibition)-[:INCLUDES_ARTWORK]->(w)
      ${RETURN_BLOCK}
      UNION ALL
      MATCH (w:Artwork)-[:USES_TECHNIQUE]->(tMatch:Technique)
      WHERE toLower(tMatch.name) CONTAINS $q ${dateAnd}
        AND NOT toLower(w.medium) CONTAINS $q
      OPTIONAL MATCH (w)-[:USES_TECHNIQUE]->(t:Technique)
      OPTIONAL MATCH (w)-[:CREATED_IN]->(p:Period)
      OPTIONAL MATCH (ex:Exhibition)-[:INCLUDES_ARTWORK]->(w)
      ${RETURN_BLOCK}
    `;

  } else if (type === "period") {
    params.q = sq;
    cypher = `
      MATCH (w:Artwork)-[:CREATED_IN]->(pMatch:Period)
      WHERE toLower(pMatch.name) CONTAINS $q ${dateAnd}
      OPTIONAL MATCH (w)-[:USES_TECHNIQUE]->(t:Technique)
      OPTIONAL MATCH (w)-[:CREATED_IN]->(p:Period)
      OPTIONAL MATCH (ex:Exhibition)-[:INCLUDES_ARTWORK]->(w)
      ${RETURN_BLOCK}
    `;

  } else if (type === "exhibition") {
    params.q = sq;
    cypher = `
      MATCH (exMatch:Exhibition)-[:INCLUDES_ARTWORK]->(w:Artwork)
      WHERE toLower(exMatch.title) CONTAINS $q
         OR toLower(exMatch.exhibitionType) CONTAINS $q
         OR toLower(exMatch.yearText) CONTAINS $q
      OPTIONAL MATCH (w)-[:USES_TECHNIQUE]->(t:Technique)
      OPTIONAL MATCH (w)-[:CREATED_IN]->(p:Period)
      OPTIONAL MATCH (ex:Exhibition)-[:INCLUDES_ARTWORK]->(w)
      ${RETURN_BLOCK}
    `;

  } else if (!q) {
    // Date-only search
    cypher = `
      MATCH (w:Artwork)
      WHERE ${dateParts.join(" AND ")}
      OPTIONAL MATCH (w)-[:USES_TECHNIQUE]->(t:Technique)
      OPTIONAL MATCH (w)-[:CREATED_IN]->(p:Period)
      OPTIONAL MATCH (ex:Exhibition)-[:INCLUDES_ARTWORK]->(w)
      ${RETURN_BLOCK}
    `;

  } else {
    // "all" — search across title, medium, technique, period, exhibition
    params.q = sq;
    cypher = `
      MATCH (w:Artwork)
      WHERE (toLower(w.title) CONTAINS $q OR toLower(w.medium) CONTAINS $q) ${dateAnd}
      OPTIONAL MATCH (w)-[:USES_TECHNIQUE]->(t:Technique)
      OPTIONAL MATCH (w)-[:CREATED_IN]->(p:Period)
      OPTIONAL MATCH (ex:Exhibition)-[:INCLUDES_ARTWORK]->(w)
      ${RETURN_BLOCK}
      UNION
      MATCH (w:Artwork)-[:USES_TECHNIQUE]->(tMatch:Technique)
      WHERE toLower(tMatch.name) CONTAINS $q ${dateAnd}
        AND NOT (toLower(w.title) CONTAINS $q OR toLower(w.medium) CONTAINS $q)
      OPTIONAL MATCH (w)-[:USES_TECHNIQUE]->(t:Technique)
      OPTIONAL MATCH (w)-[:CREATED_IN]->(p:Period)
      OPTIONAL MATCH (ex:Exhibition)-[:INCLUDES_ARTWORK]->(w)
      ${RETURN_BLOCK}
      UNION
      MATCH (w:Artwork)-[:CREATED_IN]->(pMatch:Period)
      WHERE toLower(pMatch.name) CONTAINS $q ${dateAnd}
        AND NOT (toLower(w.title) CONTAINS $q OR toLower(w.medium) CONTAINS $q)
        AND NOT exists { (w)-[:USES_TECHNIQUE]->(tEx:Technique) WHERE toLower(tEx.name) CONTAINS $q }
      OPTIONAL MATCH (w)-[:USES_TECHNIQUE]->(t:Technique)
      OPTIONAL MATCH (w)-[:CREATED_IN]->(p:Period)
      OPTIONAL MATCH (ex:Exhibition)-[:INCLUDES_ARTWORK]->(w)
      ${RETURN_BLOCK}
    `;
  }

  // ── Connect & query ───────────────────────────────────────────────────────
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
        "Content-Type":  "application/json",
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

  // Deduplicate by artworkId (safety net in case UNION still produces dupes)
  const seen    = new Set();
  const results = [];
  for (const row of rows) {
    const obj = {};
    fields.forEach((f, i) => { obj[f] = row[i]; });
    const key = obj.artworkId || obj.title;
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);

    // Flatten collected arrays to single values for card display
    obj.technique = Array.isArray(obj.techniques) ? obj.techniques.filter(Boolean).join(", ") : (obj.technique || "");
    obj.period    = Array.isArray(obj.periods)    ? obj.periods.filter(Boolean)[0]            : (obj.period    || "");

    results.push(obj);
  }

  return new Response(
    JSON.stringify({ query: q, type, count: results.length, results }),
    { status: 200, headers: cors }
  );
}
