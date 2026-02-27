/**
 * Cloudflare Pages Function: /api/life-and-times
 *
 * Returns all data for the Life and Times timeline:
 *   - LifeEvents (John Luke, James Luke diary, Luke family history)
 *   - Artefacts (letters with transcriptions)
 *   - Artworks (dated, for scrapbook display)
 *
 * Each item has a year so the timeline can place it correctly.
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
      JSON.stringify({ events: [], artefacts: [], artworks: [], source: "no-db" }),
      { headers: cors }
    );
  }

  const host     = env.NEO4J_URI
    .replace(/^neo4j\+s:\/\//, "https://")
    .replace(/^neo4j:\/\//, "http://")
    .replace(/\/$/, "");
  const endpoint = `${host}/db/neo4j/query/v2`;
  const creds    = btoa(`${env.NEO4J_USER}:${env.NEO4J_PASSWORD}`);

  async function runQuery(cypher) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${creds}`,
        "Content-Type":  "application/json",
        "Accept":        "application/json",
      },
      body: JSON.stringify({ statement: cypher, parameters: {} }),
    });
    const raw = await res.text();
    if (!res.ok) throw new Error(`Neo4j ${res.status}: ${raw.slice(0, 200)}`);
    const data   = JSON.parse(raw);
    const fields = data?.data?.fields || [];
    const values = data?.data?.values || [];
    return values.map(row => {
      const obj = {};
      fields.forEach((f, i) => obj[f] = row[i]);
      return obj;
    });
  }

  try {
    const [events, artefacts, artworks] = await Promise.all([

      // All life events — John, James, Luke family
      runQuery(`
        MATCH (e:LifeEvent)
        WHERE e.year IS NOT NULL
        RETURN
          e.eventId      AS eventId,
          e.year         AS year,
          e.month        AS month,
          e.day          AS day,
          e.dateLabel    AS dateLabel,
          e.text         AS text,
          e.significance AS significance,
          e.subject      AS subject,
          e.source       AS source,
          e.mentionsJohn AS mentionsJohn,
          e.tags         AS tags
        ORDER BY e.year ASC, e.month ASC, e.day ASC
      `),

      // All letter artefacts with transcriptions and mentioned artworks
      runQuery(`
        MATCH (a:Artefact)
        WHERE a.type = 'letter' AND a.year IS NOT NULL
        OPTIONAL MATCH (a)-[:MENTIONS]->(w:Artwork)
        WITH a, collect(DISTINCT {title: w.title, artworkId: w.artworkId, thumbnailUrl: w.thumbnailUrl, imageUrl: w.imageUrl}) AS mentionedArtworks
        RETURN
          a.artefactId    AS artefactId,
          a.year          AS year,
          a.month         AS month,
          a.day           AS day,
          a.dateLabel     AS dateLabel,
          a.title         AS title,
          a.sender        AS sender,
          a.recipient     AS recipient,
          a.wordCount     AS wordCount,
          a.transcription AS transcription,
          a.note          AS note,
          a.pages         AS pages,
          a.institution   AS institution,
          [mw IN mentionedArtworks WHERE mw.title IS NOT NULL] AS mentionedArtworks
        ORDER BY a.year ASC, a.month ASC, a.day ASC
      `),

      // Dated artworks for scrapbook display
      runQuery(`
        MATCH (w:Artwork)
        WHERE w.yearFrom IS NOT NULL
        RETURN
          w.artworkId    AS artworkId,
          w.title        AS title,
          w.yearFrom     AS year,
          w.dateText     AS dateText,
          w.medium       AS medium,
          w.thumbnailUrl AS thumbnailUrl,
          w.imageUrl     AS imageUrl,
          coalesce(w.selectedCatalogue, false) AS selected
        ORDER BY w.yearFrom ASC
      `),
    ]);

    return new Response(
      JSON.stringify({ events, artefacts, artworks, source: "neo4j" }),
      { headers: cors }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ events: [], artefacts: [], artworks: [], source: "error", error: err.message }),
      { headers: cors }
    );
  }
}
