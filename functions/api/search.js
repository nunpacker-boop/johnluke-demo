/**
 * Cloudflare Pages Function: /api/search
 *
 * Schema:
 *   (:Artwork) props: title, medium, dateText, yearFrom, yearTo,
 *                     currentLocation, dimensionsText, legacyRef, notes, slug
 *   (:Artwork)-[:USES_TECHNIQUE]->(:Technique { name })
 *   (:Artwork)-[:CREATED_IN]->(:Period { name })
 *   (:Artwork)-[:HOUSED_AT]->(:Institution)
 *   (:Exhibition)-[:INCLUDES_ARTWORK]->(:Artwork)
 *   (:Exhibition) props: title, yearText, exhibitionType
 */

export async function onRequestGet({ request, env }) {
  const cors = {
    "Access-Control-Allow-Origin": "*",
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
  let cypher = "";

  // Date filter fragment — appended as AND clause
  const dateParts = [];
  if (dateFrom) { dateParts.push("w.yearFrom >= $dateFrom"); params.dateFrom = dateFrom; }
  if (dateTo)   { dateParts.push("w.yearTo   <= $dateTo");   params.dateTo   = dateTo; }
  const dateAnd = dateParts.length ? " AND " + dateParts.join(" AND ") : "";

  // ── Query shapes ──────────────────────────────────────────────────────────
  // Key principle: filter BEFORE optional matches so WHERE works cleanly.
  // We use subqueries / UNION patterns to avoid null-contamination from
  // OPTIONAL MATCH interfering with WHERE clauses.

  if (type === "title") {
    params.q = sq;
    cypher = `
      MATCH (w:Artwork)
      WHERE toLower(w.title) CONTAINS $q ${dateAnd}
      OPTIONAL MATCH (w)-[:USES_TECHNIQUE]->(t:Technique)
      OPTIONAL MATCH (w)-[:CREATED_IN]->(p:Period)
      OPTIONAL MATCH (ex:Exhibition)-[:INCLUDES_ARTWORK]->(w)
      RETURN DISTINCT w.title AS title, w.dateText AS dateText,
        w.yearFrom AS yearFrom, w.medium AS medium, w.legacyRef AS legacyRef,
        w.currentLocation AS location, w.dimensionsText AS dimensions, w.slug AS slug,
        t.name AS technique, p.name AS period,
        collect(DISTINCT ex.title)[0..3] AS exhibitions
      ORDER BY w.yearFrom ASC, w.title ASC LIMIT $limit
    `;

  } else if (type === "medium") {
    params.q = sq;
    // Two separate matches — direct medium prop, and via Technique node — then UNION
    cypher = `
      MATCH (w:Artwork)
      WHERE toLower(w.medium) CONTAINS $q ${dateAnd}
      OPTIONAL MATCH (w)-[:USES_TECHNIQUE]->(t:Technique)
      OPTIONAL MATCH (w)-[:CREATED_IN]->(p:Period)
      OPTIONAL MATCH (ex:Exhibition)-[:INCLUDES_ARTWORK]->(w)
      RETURN DISTINCT w.title AS title, w.dateText AS dateText,
        w.yearFrom AS yearFrom, w.medium AS medium, w.legacyRef AS legacyRef,
        w.currentLocation AS location, w.dimensionsText AS dimensions, w.slug AS slug,
        t.name AS technique, p.name AS period,
        collect(DISTINCT ex.title)[0..3] AS exhibitions
      UNION
      MATCH (w:Artwork)-[:USES_TECHNIQUE]->(t:Technique)
      WHERE toLower(t.name) CONTAINS $q ${dateAnd}
      OPTIONAL MATCH (w)-[:CREATED_IN]->(p:Period)
      OPTIONAL MATCH (ex:Exhibition)-[:INCLUDES_ARTWORK]->(w)
      RETURN DISTINCT w.title AS title, w.dateText AS dateText,
        w.yearFrom AS yearFrom, w.medium AS medium, w.legacyRef AS legacyRef,
        w.currentLocation AS location, w.dimensionsText AS dimensions, w.slug AS slug,
        t.name AS technique, p.name AS period,
        collect(DISTINCT ex.title)[0..3] AS exhibitions
    `;
    // Note: UNION doesn't support top-level ORDER BY/LIMIT in all Neo4j versions
    // so we wrap it — but Aura supports it directly, limit applied per branch

  } else if (type === "period") {
    params.q = sq;
    cypher = `
      MATCH (w:Artwork)-[:CREATED_IN]->(p:Period)
      WHERE toLower(p.name) CONTAINS $q ${dateAnd}
      OPTIONAL MATCH (w)-[:USES_TECHNIQUE]->(t:Technique)
      OPTIONAL MATCH (ex:Exhibition)-[:INCLUDES_ARTWORK]->(w)
      RETURN DISTINCT w.title AS title, w.dateText AS dateText,
        w.yearFrom AS yearFrom, w.medium AS medium, w.legacyRef AS legacyRef,
        w.currentLocation AS location, w.dimensionsText AS dimensions, w.slug AS slug,
        t.name AS technique, p.name AS period,
        collect(DISTINCT ex.title)[0..3] AS exhibitions
      ORDER BY w.yearFrom ASC, w.title ASC LIMIT $limit
    `;

  } else if (type === "exhibition") {
    params.q = sq;
    cypher = `
      MATCH (ex:Exhibition)-[:INCLUDES_ARTWORK]->(w:Artwork)
      WHERE toLower(ex.title) CONTAINS $q
         OR toLower(ex.exhibitionType) CONTAINS $q
         OR toLower(ex.yearText) CONTAINS $q
      OPTIONAL MATCH (w)-[:USES_TECHNIQUE]->(t:Technique)
      OPTIONAL MATCH (w)-[:CREATED_IN]->(p:Period)
      WITH w, t, p, collect(DISTINCT ex.title)[0..3] AS exhibitions
      RETURN DISTINCT w.title AS title, w.dateText AS dateText,
        w.yearFrom AS yearFrom, w.medium AS medium, w.legacyRef AS legacyRef,
        w.currentLocation AS location, w.dimensionsText AS dimensions, w.slug AS slug,
        t.name AS technique, p.name AS period, exhibitions
      ORDER BY w.yearFrom ASC, w.title ASC LIMIT $limit
    `;

  } else {
    // "all" — search across title, medium, technique name, period name
    // Use UNION of targeted matches so WHERE always fires on real values (no nulls)
    params.q = sq;

    // If date-only (no text query), use simple match
    if (!q) {
      cypher = `
        MATCH (w:Artwork)
        WHERE ${dateParts.join(" AND ")}
        OPTIONAL MATCH (w)-[:USES_TECHNIQUE]->(t:Technique)
        OPTIONAL MATCH (w)-[:CREATED_IN]->(p:Period)
        OPTIONAL MATCH (ex:Exhibition)-[:INCLUDES_ARTWORK]->(w)
        RETURN DISTINCT w.title AS title, w.dateText AS dateText,
          w.yearFrom AS yearFrom, w.medium AS medium, w.legacyRef AS legacyRef,
          w.currentLocation AS location, w.dimensionsText AS dimensions, w.slug AS slug,
          t.name AS technique, p.name AS period,
          collect(DISTINCT ex.title)[0..3] AS exhibitions
        ORDER BY w.yearFrom ASC, w.title ASC LIMIT $limit
      `;
    } else {
      // Title / medium match
      cypher = `
        MATCH (w:Artwork)
        WHERE (toLower(w.title) CONTAINS $q OR toLower(w.medium) CONTAINS $q) ${dateAnd}
        OPTIONAL MATCH (w)-[:USES_TECHNIQUE]->(t:Technique)
        OPTIONAL MATCH (w)-[:CREATED_IN]->(p:Period)
        OPTIONAL MATCH (ex:Exhibition)-[:INCLUDES_ARTWORK]->(w)
        RETURN DISTINCT w.title AS title, w.dateText AS dateText,
          w.yearFrom AS yearFrom, w.medium AS medium, w.legacyRef AS legacyRef,
          w.currentLocation AS location, w.dimensionsText AS dimensions, w.slug AS slug,
          t.name AS technique, p.name AS period,
          collect(DISTINCT ex.title)[0..3] AS exhibitions
        UNION
        MATCH (w:Artwork)-[:USES_TECHNIQUE]->(t:Technique)
        WHERE toLower(t.name) CONTAINS $q ${dateAnd}
        OPTIONAL MATCH (w)-[:CREATED_IN]->(p:Period)
        OPTIONAL MATCH (ex:Exhibition)-[:INCLUDES_ARTWORK]->(w)
        RETURN DISTINCT w.title AS title, w.dateText AS dateText,
          w.yearFrom AS yearFrom, w.medium AS medium, w.legacyRef AS legacyRef,
          w.currentLocation AS location, w.dimensionsText AS dimensions, w.slug AS slug,
          t.name AS technique, p.name AS period,
          collect(DISTINCT ex.title)[0..3] AS exhibitions
        UNION
        MATCH (w:Artwork)-[:CREATED_IN]->(p:Period)
        WHERE toLower(p.name) CONTAINS $q ${dateAnd}
        OPTIONAL MATCH (w)-[:USES_TECHNIQUE]->(t:Technique)
        OPTIONAL MATCH (ex:Exhibition)-[:INCLUDES_ARTWORK]->(w)
        RETURN DISTINCT w.title AS title, w.dateText AS dateText,
          w.yearFrom AS yearFrom, w.medium AS medium, w.legacyRef AS legacyRef,
          w.currentLocation AS location, w.dimensionsText AS dimensions, w.slug AS slug,
          t.name AS technique, p.name AS period,
          collect(DISTINCT ex.title)[0..3] AS exhibitions
      `;
    }
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
