/**
 * Cloudflare Pages Function: /api/exhibitions
 *
 * Returns all Exhibition nodes with artwork counts and type metadata.
 * Optional ?id= param returns a single exhibition with full artwork list.
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
      JSON.stringify({ error: "Database not configured." }),
      { status: 503, headers: cors }
    );
  }

  const host        = env.NEO4J_URI
    .replace(/^neo4j\+s:\/\//, "https://")
    .replace(/^neo4j:\/\//, "http://")
    .replace(/\/$/, "");
  const endpoint    = `${host}/db/neo4j/query/v2`;
  const credentials = btoa(`${env.NEO4J_USER}:${env.NEO4J_PASSWORD}`);

  const url = new URL(request.url);
  const id  = url.searchParams.get("id") || null;  // exhibitionId for detail view

  let cypher, params = {};

  if (id) {
    // ── Detail: single exhibition with full artwork list ───────────────────
    cypher = `
      MATCH (ex:Exhibition {exhibitionId: $id})
      OPTIONAL MATCH (ex)-[r:INCLUDES_ARTWORK]->(w:Artwork)
      OPTIONAL MATCH (w)-[:USES_TECHNIQUE]->(t:Technique)
      WITH ex, w, r,
           collect(DISTINCT t.name) AS techniques
      WITH ex,
           collect(
             CASE WHEN w IS NOT NULL THEN {
               artworkId:    w.artworkId,
               title:        w.title,
               dateText:     w.dateText,
               medium:       w.medium,
               thumbnailUrl: w.thumbnailUrl,
               imageUrl:     w.imageUrl,
               catalogueNumber: r.catalogueNumber,
               roomOrGallery:   r.roomOrGallery,
               salePrice:       r.salePrice,
               sold:            r.sold,
               catalogueNotes:  r.catalogueNotes,
               notes:           r.notes,
               techniques:   techniques
             } ELSE null END
           ) AS artworksRaw
      RETURN
        ex.exhibitionId    AS exhibitionId,
        ex.title           AS title,
        ex.yearText        AS yearText,
        ex.openingDate     AS openingDate,
        ex.closingDate     AS closingDate,
        ex.exhibitionType  AS exhibitionType,
        ex.venue           AS venue,
        ex.organiser       AS organiser,
        ex.reliability     AS reliability,
        ex.catalogueRef    AS catalogueRef,
        ex.catalogueUrl    AS catalogueUrl,
        ex.notes           AS notes,
        [a IN artworksRaw WHERE a IS NOT NULL] AS artworks
    `;
    params = { id };
  } else {
    // ── List: all exhibitions ordered by year ─────────────────────────────
    cypher = `
      MATCH (ex:Exhibition)
      OPTIONAL MATCH (ex)-[:INCLUDES_ARTWORK]->(w:Artwork)
      WITH ex, count(DISTINCT w) AS artworkCount
      RETURN
        ex.exhibitionId    AS exhibitionId,
        ex.title           AS title,
        ex.yearText        AS yearText,
        ex.openingDate     AS openingDate,
        ex.closingDate     AS closingDate,
        ex.exhibitionType  AS exhibitionType,
        ex.venue           AS venue,
        ex.organiser       AS organiser,
        ex.reliability     AS reliability,
        ex.catalogueRef    AS catalogueRef,
        ex.catalogueUrl    AS catalogueUrl,
        ex.notes           AS notes,
        artworkCount       AS artworkCount
      ORDER BY ex.yearText ASC
    `;
  }

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
  try { data = JSON.parse(raw); } catch {
    return new Response(JSON.stringify({ error: "Invalid response from Neo4j" }), { status: 200, headers: cors });
  }

  const fields = data?.data?.fields || [];
  const values = data?.data?.values || [];
  const rows   = values.map(row => {
    const obj = {};
    fields.forEach((f, i) => obj[f] = row[i]);
    return obj;
  });

  if (id) {
    // Return single exhibition object
    const ex = rows[0] || null;
    return new Response(JSON.stringify({ exhibition: ex }), { headers: cors });
  } else {
    return new Response(JSON.stringify({ exhibitions: rows, count: rows.length }), { headers: cors });
  }
}
