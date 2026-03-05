/**
 * Cloudflare Pages Function: /api/document
 * GET /api/document?id=doc-xxx&tier=public|researcher
 *
 * Returns document with excerpts filtered by access tier.
 * Full text only returned for researcher tier (future: check auth).
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
    return new Response(JSON.stringify({ error: "Database not configured" }), { status: 503, headers: cors });
  }

  const url  = new URL(request.url);
  const id   = (url.searchParams.get("id") || "").trim();
  // TODO: replace with real auth check when researcher accounts are built
  const tier = url.searchParams.get("tier") || "public";

  if (!id) return new Response(JSON.stringify({ error: "No document id" }), { status: 400, headers: cors });

  const host     = env.NEO4J_URI.replace(/^neo4j\+s:\/\//, "https://").replace(/^neo4j:\/\//, "http://").replace(/\/$/, "");
  const endpoint = `${host}/db/neo4j/query/v2`;
  const creds    = btoa(`${env.NEO4J_USER}:${env.NEO4J_PASSWORD}`);

  const cypher = `
    MATCH (d:Document {documentId: $id})
    OPTIONAL MATCH (e:Excerpt)-[:FROM_DOCUMENT]->(d)
    OPTIONAL MATCH (e)-[:REFERENCES_ARTWORK]->(w:Artwork)
    WITH d,
      collect(DISTINCT CASE WHEN e IS NOT NULL THEN {
        excerptId:    e.excerptId,
        text:         e.text,
        context:      e.context,
        accessTier:   e.accessTier,
        confidence:   e.confidence,
        altTitleUsed: e.altTitleUsed,
        topics:       e.topics,
        artworkId:    w.artworkId,
        artworkTitle: w.title,
        artworkYear:  w.yearFrom,
        artworkThumb: w.thumbnailUrl
      } ELSE null END) AS allExcerpts
    RETURN
      d.documentId   AS documentId,
      d.title        AS title,
      d.type         AS type,
      d.author       AS author,
      d.recipient    AS recipient,
      d.dateText     AS dateText,
      d.yearFrom     AS yearFrom,
      d.archiveRef   AS archiveRef,
      d.source       AS source,
      d.summary      AS summary,
      d.accessTier   AS accessTier,
      CASE WHEN $tier = "researcher" THEN d.fullText ELSE null END AS fullText,
      [e IN allExcerpts WHERE e IS NOT NULL
        AND (e.accessTier = "public" OR $tier = "researcher")
      ] AS excerpts
  `;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${creds}`,
        "Content-Type":  "application/json",
        "Accept":        "application/json",
      },
      body: JSON.stringify({ statement: cypher, parameters: { id, tier } }),
    });

    const data = await res.json();
    if (data.errors?.length) throw new Error(data.errors[0].message);

    const fields = data?.data?.fields || [];
    const values = data?.data?.values || [];
    const rows   = values.map(row => Object.fromEntries(fields.map((f, i) => [f, row[i]])));
    const doc    = rows[0] || null;

    return new Response(JSON.stringify({ document: doc }), { headers: cors });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: cors });
  }
}
