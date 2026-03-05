/**
 * Cloudflare Pages Function: /api/admin
 * Protected by Cloudflare Access at the edge — this function
 * assumes any request reaching it is already authenticated.
 *
 * POST /api/admin  { action, params }
 *
 * Actions:
 *   artworks_list       — all artworks, paginated
 *   artwork_get         — single artwork by id
 *   artwork_update      — update artwork fields
 *   artwork_delete      — delete artwork node
 *   documents_list      — all documents
 *   document_get        — single document by id
 *   document_create     — create document node
 *   document_update     — update document fields
 *   excerpts_list       — excerpts for a document
 *   excerpt_create      — create excerpt + relationships
 *   excerpt_update      — update excerpt
 *   excerpt_delete      — delete excerpt
 *   artworks_search     — search artworks by title for tagging lookup
 *   commissions_list    — all commissions
 *   commission_create   — create commission record
 *   commission_update   — update commission
 *   stats               — dashboard summary counts
 */

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

export async function onRequestPost({ request, env }) {
  if (!env.NEO4J_URI || !env.NEO4J_USER || !env.NEO4J_PASSWORD) {
    return new Response(JSON.stringify({ error: "Database not configured" }), { status: 503, headers: CORS });
  }

  let body;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: CORS });
  }

  const { action, params = {} } = body;

  const host     = env.NEO4J_URI.replace(/^neo4j\+s:\/\//, "https://").replace(/^neo4j:\/\//, "http://").replace(/\/$/, "");
  const endpoint = `${host}/db/neo4j/query/v2`;
  const creds    = btoa(`${env.NEO4J_USER}:${env.NEO4J_PASSWORD}`);

  async function run(statement, parameters = {}) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Authorization": `Basic ${creds}`, "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ statement, parameters }),
    });
    const data = await res.json();
    if (data.errors?.length) throw new Error(data.errors[0].message);
    const fields = data?.data?.fields || [];
    const values = data?.data?.values || [];
    return values.map(row => Object.fromEntries(fields.map((f, i) => [f, row[i]])));
  }

  try {
    switch (action) {

      // ── STATS ──────────────────────────────────────────────────────────────
      case "stats": {
        const rows = await run(`
          MATCH (a:Artwork) WITH count(a) AS artworks
          OPTIONAL MATCH (d:Document) WITH artworks, count(d) AS documents
          OPTIONAL MATCH (e:Excerpt) WITH artworks, documents, count(e) AS excerpts
          OPTIONAL MATCH (c:Commission) WITH artworks, documents, excerpts, count(c) AS commissions
          OPTIONAL MATCH (a2:Artwork) WHERE a2.medium IS NULL WITH artworks, documents, excerpts, commissions, count(a2) AS missingMedium
          OPTIONAL MATCH (a3:Artwork) WHERE a3.theme IS NULL WITH artworks, documents, excerpts, commissions, missingMedium, count(a3) AS missingTheme
          RETURN artworks, documents, excerpts, commissions, missingMedium, missingTheme
        `);
        return new Response(JSON.stringify({ stats: rows[0] || {} }), { headers: CORS });
      }

      // ── ARTWORKS ───────────────────────────────────────────────────────────
      case "artworks_list": {
        const { search = "", offset = 0, limit = 50 } = params;
        const rows = await run(`
          MATCH (w:Artwork)
          WHERE ($search = "" OR toLower(w.title) CONTAINS toLower($search) OR toLower(w.artworkId) CONTAINS toLower($search))
          RETURN w.artworkId AS artworkId, w.title AS title, w.yearFrom AS yearFrom,
                 w.medium AS medium, w.theme AS theme, w.support AS support,
                 w.selectedCatalogue AS selectedCatalogue, w.isStudy AS isStudy,
                 w.timelineVisible AS timelineVisible, w.thumbnailUrl AS thumbnailUrl
          ORDER BY w.yearFrom ASC, w.artworkId ASC
          SKIP $offset LIMIT $limit
        `, { search, offset: parseInt(offset), limit: parseInt(limit) });
        const total = await run(`
          MATCH (w:Artwork)
          WHERE ($search = "" OR toLower(w.title) CONTAINS toLower($search) OR toLower(w.artworkId) CONTAINS toLower($search))
          RETURN count(w) AS total
        `, { search });
        return new Response(JSON.stringify({ artworks: rows, total: total[0]?.total || 0 }), { headers: CORS });
      }

      case "artwork_get": {
        const rows = await run(`
          MATCH (w:Artwork {artworkId: $id})
          OPTIONAL MATCH (w)-[:USES_TECHNIQUE]->(t:Technique)
          OPTIONAL MATCH (w)-[:CREATED_IN]->(p:Period)
          RETURN w.artworkId AS artworkId, w.title AS title, w.dateText AS dateText,
                 w.yearFrom AS yearFrom, w.yearTo AS yearTo, w.medium AS medium,
                 w.support AS support, w.theme AS theme, w.mediumNotes AS mediumNotes,
                 w.description AS description, w.notes AS notes,
                 w.dimensionsText AS dimensionsText, w.heightCm AS heightCm, w.widthCm AS widthCm,
                 w.currentLocation AS currentLocation, w.imageUrl AS imageUrl,
                 w.thumbnailUrl AS thumbnailUrl, w.imageSlug AS imageSlug,
                 w.selectedCatalogue AS selectedCatalogue, w.isStudy AS isStudy,
                 w.timelineVisible AS timelineVisible, w.dateUncertain AS dateUncertain,
                 w.signature AS signature, w.condition AS condition,
                 collect(DISTINCT t.name) AS techniques,
                 collect(DISTINCT p.name) AS periods
        `, { id: params.id });
        return new Response(JSON.stringify({ artwork: rows[0] || null }), { headers: CORS });
      }

      case "artwork_update": {
        const ALLOWED = new Set([
          "title", "dateText", "yearFrom", "yearTo", "dateUncertain",
          "medium", "support", "mediumNotes", "theme", "description", "notes",
          "dimensionsText", "heightCm", "widthCm", "currentLocation",
          "selectedCatalogue", "isStudy", "timelineVisible",
          "signature", "condition",
        ]);
        const updates = Object.entries(params.fields || {}).filter(([k]) => ALLOWED.has(k));
        if (!updates.length) return new Response(JSON.stringify({ error: "No valid fields" }), { status: 400, headers: CORS });
        const setClauses = updates.map(([k]) => `w.${k} = $${k}`).join(", ");
        await run(
          `MATCH (w:Artwork {artworkId: $id}) SET ${setClauses}`,
          { id: params.id, ...Object.fromEntries(updates) }
        );
        return new Response(JSON.stringify({ ok: true }), { headers: CORS });
      }

      // ── ARTWORK SEARCH for tagger lookup ──────────────────────────────────
      case "artworks_search": {
        const rows = await run(`
          MATCH (w:Artwork)
          WHERE toLower(w.title) CONTAINS toLower($q) OR toLower(w.artworkId) CONTAINS toLower($q)
          RETURN w.artworkId AS artworkId, w.title AS title,
                 w.yearFrom AS yearFrom, w.thumbnailUrl AS thumbnailUrl
          ORDER BY w.yearFrom ASC LIMIT 12
        `, { q: params.q || "" });
        return new Response(JSON.stringify({ artworks: rows }), { headers: CORS });
      }

      // ── DOCUMENTS ─────────────────────────────────────────────────────────
      case "documents_list": {
        const rows = await run(`
          MATCH (d:Document)
          OPTIONAL MATCH (d)<-[:FROM_DOCUMENT]-(e:Excerpt)
          RETURN d.documentId AS documentId, d.title AS title, d.type AS type,
                 d.author AS author, d.recipient AS recipient, d.dateText AS dateText,
                 d.yearFrom AS yearFrom, d.archiveRef AS archiveRef,
                 d.accessTier AS accessTier, d.summary AS summary,
                 count(e) AS excerptCount
          ORDER BY d.yearFrom ASC, d.documentId ASC
        `);
        return new Response(JSON.stringify({ documents: rows }), { headers: CORS });
      }

      case "document_get": {
        const rows = await run(`
          MATCH (d:Document {documentId: $id})
          OPTIONAL MATCH (d)<-[:FROM_DOCUMENT]-(e:Excerpt)
          OPTIONAL MATCH (e)-[:REFERENCES_ARTWORK]->(w:Artwork)
          RETURN d.documentId AS documentId, d.title AS title, d.type AS type,
                 d.author AS author, d.recipient AS recipient, d.dateText AS dateText,
                 d.yearFrom AS yearFrom, d.archiveRef AS archiveRef,
                 d.source AS source, d.summary AS summary,
                 d.accessTier AS accessTier, d.fullText AS fullText,
                 collect(DISTINCT {
                   excerptId: e.excerptId, text: e.text, context: e.context,
                   accessTier: e.accessTier, confidence: e.confidence,
                   altTitleUsed: e.altTitleUsed, topics: e.topics,
                   artworkId: w.artworkId, artworkTitle: w.title
                 }) AS excerpts
        `, { id: params.id });
        return new Response(JSON.stringify({ document: rows[0] || null }), { headers: CORS });
      }

      case "document_create": {
        const id = `doc-${Date.now()}`;
        await run(`
          CREATE (d:Document {
            documentId: $id, title: $title, type: $type,
            author: $author, recipient: $recipient, dateText: $dateText,
            yearFrom: $yearFrom, archiveRef: $archiveRef, source: $source,
            summary: $summary, accessTier: $accessTier, fullText: $fullText
          })
        `, { id, ...params });
        return new Response(JSON.stringify({ ok: true, documentId: id }), { headers: CORS });
      }

      case "document_update": {
        const ALLOWED = new Set(["title","type","author","recipient","dateText","yearFrom",
          "archiveRef","source","summary","accessTier","fullText"]);
        const updates = Object.entries(params.fields || {}).filter(([k]) => ALLOWED.has(k));
        if (!updates.length) return new Response(JSON.stringify({ error: "No valid fields" }), { status: 400, headers: CORS });
        const setClauses = updates.map(([k]) => `d.${k} = $${k}`).join(", ");
        await run(`MATCH (d:Document {documentId: $id}) SET ${setClauses}`,
          { id: params.id, ...Object.fromEntries(updates) });
        return new Response(JSON.stringify({ ok: true }), { headers: CORS });
      }

      // ── EXCERPTS ──────────────────────────────────────────────────────────
      case "excerpt_create": {
        const id = `exc-${Date.now()}`;
        await run(`
          MATCH (d:Document {documentId: $docId})
          CREATE (e:Excerpt {
            excerptId: $id, text: $text, context: $context,
            accessTier: $accessTier, confidence: $confidence,
            altTitleUsed: $altTitleUsed, topics: $topics
          })
          CREATE (e)-[:FROM_DOCUMENT]->(d)
          WITH e
          OPTIONAL MATCH (w:Artwork {artworkId: $artworkId})
          FOREACH (_ IN CASE WHEN w IS NOT NULL THEN [1] ELSE [] END |
            CREATE (e)-[:REFERENCES_ARTWORK]->(w)
          )
        `, {
          id,
          docId: params.documentId,
          text: params.text || "",
          context: params.context || "",
          accessTier: params.accessTier || "researcher",
          confidence: params.confidence || "certain",
          altTitleUsed: params.altTitleUsed || null,
          topics: params.topics || [],
          artworkId: params.artworkId || null,
        });
        return new Response(JSON.stringify({ ok: true, excerptId: id }), { headers: CORS });
      }

      case "excerpt_update": {
        const ALLOWED = new Set(["text","context","accessTier","confidence","altTitleUsed","topics"]);
        const updates = Object.entries(params.fields || {}).filter(([k]) => ALLOWED.has(k));
        const setClauses = updates.map(([k]) => `e.${k} = $${k}`).join(", ");
        if (setClauses) {
          await run(`MATCH (e:Excerpt {excerptId: $id}) SET ${setClauses}`,
            { id: params.id, ...Object.fromEntries(updates) });
        }
        // Update artwork link if provided
        if (params.artworkId !== undefined) {
          await run(`
            MATCH (e:Excerpt {excerptId: $id})
            OPTIONAL MATCH (e)-[r:REFERENCES_ARTWORK]->() DELETE r
            WITH e
            OPTIONAL MATCH (w:Artwork {artworkId: $artworkId})
            FOREACH (_ IN CASE WHEN w IS NOT NULL THEN [1] ELSE [] END |
              CREATE (e)-[:REFERENCES_ARTWORK]->(w)
            )
          `, { id: params.id, artworkId: params.artworkId });
        }
        return new Response(JSON.stringify({ ok: true }), { headers: CORS });
      }

      case "excerpt_delete": {
        await run(`MATCH (e:Excerpt {excerptId: $id}) DETACH DELETE e`, { id: params.id });
        return new Response(JSON.stringify({ ok: true }), { headers: CORS });
      }

      // ── DOCUMENT IMAGES ──────────────────────────────────────────────────
      case "document_image_add": {
        const imgId = `dimg-${Date.now()}`;
        await run(`
          MATCH (d:Document {documentId: $docId})
          CREATE (i:DocumentImage {
            imageId:      $imgId,
            page:         $page,
            imageUrl:     $imageUrl,
            thumbnailUrl: $thumbnailUrl,
            imageSlug:    $imageSlug,
            caption:      $caption,
            accessTier:   $accessTier
          })
          CREATE (i)-[:IMAGE_OF]->(d)
        `, {
          docId:        params.documentId,
          imgId,
          page:         params.page         || 1,
          imageUrl:     params.imageUrl      || "",
          thumbnailUrl: params.thumbnailUrl  || "",
          imageSlug:    params.imageSlug     || "",
          caption:      params.caption       || "",
          accessTier:   params.accessTier    || "researcher",
        });
        return new Response(JSON.stringify({ ok: true, imageId: imgId }), { headers: CORS });
      }

      case "document_image_delete": {
        await run(`MATCH (i:DocumentImage {imageId: $id}) DETACH DELETE i`, { id: params.id });
        return new Response(JSON.stringify({ ok: true }), { headers: CORS });
      }

      case "document_image_list": {
        const rows = await run(`
          MATCH (i:DocumentImage)-[:IMAGE_OF]->(d:Document {documentId: $docId})
          RETURN i.imageId AS imageId, i.page AS page,
                 i.imageUrl AS imageUrl, i.thumbnailUrl AS thumbnailUrl,
                 i.imageSlug AS imageSlug, i.caption AS caption,
                 i.accessTier AS accessTier
          ORDER BY i.page ASC
        `, { docId: params.documentId });
        return new Response(JSON.stringify({ images: rows }), { headers: CORS });
      }

      // ── DOCUMENT → ARTWORK DEPICTS LINK ──────────────────────────────────
      // Used for photographs that show a finished artwork
      case "document_depicts_set": {
        await run(`
          MATCH (d:Document {documentId: $docId})
          OPTIONAL MATCH (d)-[r:DEPICTS_ARTWORK]->() DELETE r
          WITH d
          OPTIONAL MATCH (w:Artwork {artworkId: $artworkId})
          FOREACH (_ IN CASE WHEN w IS NOT NULL THEN [1] ELSE [] END |
            CREATE (d)-[:DEPICTS_ARTWORK]->(w)
          )
        `, { docId: params.documentId, artworkId: params.artworkId || null });
        return new Response(JSON.stringify({ ok: true }), { headers: CORS });
      }

      case "document_depicts_get": {
        const rows = await run(`
          MATCH (d:Document {documentId: $id})
          OPTIONAL MATCH (d)-[:DEPICTS_ARTWORK]->(w:Artwork)
          RETURN w.artworkId AS artworkId, w.title AS title,
                 w.dateText AS dateText, w.thumbnailUrl AS thumbnailUrl
        `, { id: params.id });
        const artwork = rows[0]?.artworkId ? rows[0] : null;
        return new Response(JSON.stringify({ artwork }), { headers: CORS });
      }

      case "document_depicts_remove": {
        await run(`
          MATCH (d:Document {documentId: $docId})-[r:DEPICTS_ARTWORK]->()
          DELETE r
        `, { docId: params.documentId });
        return new Response(JSON.stringify({ ok: true }), { headers: CORS });
      }

      // ── COMMISSIONS ───────────────────────────────────────────────────────
      case "commissions_list": {
        const rows = await run(`
          MATCH (c:Commission)
          OPTIONAL MATCH (c)-[:COMMISSION_FOR]->(w:Artwork)
          RETURN c.commissionId AS commissionId, c.commissioner AS commissioner,
                 c.dateText AS dateText, c.yearFrom AS yearFrom,
                 c.type AS type, c.fee AS fee, c.currency AS currency,
                 c.purpose AS purpose, c.notes AS notes,
                 w.artworkId AS artworkId, w.title AS artworkTitle
          ORDER BY c.yearFrom ASC
        `);
        return new Response(JSON.stringify({ commissions: rows }), { headers: CORS });
      }

      case "commission_create": {
        const id = `com-${Date.now()}`;
        await run(`
          CREATE (c:Commission {
            commissionId: $id, commissioner: $commissioner,
            dateText: $dateText, yearFrom: $yearFrom,
            type: $type, fee: $fee, currency: $currency,
            purpose: $purpose, notes: $notes
          })
          WITH c
          OPTIONAL MATCH (w:Artwork {artworkId: $artworkId})
          FOREACH (_ IN CASE WHEN w IS NOT NULL THEN [1] ELSE [] END |
            CREATE (c)-[:COMMISSION_FOR]->(w)
          )
        `, { id, ...params });
        return new Response(JSON.stringify({ ok: true, commissionId: id }), { headers: CORS });
      }

      case "commission_update": {
        const ALLOWED = new Set(["commissioner","dateText","yearFrom","type","fee","currency","purpose","notes"]);
        const updates = Object.entries(params.fields || {}).filter(([k]) => ALLOWED.has(k));
        if (updates.length) {
          const setClauses = updates.map(([k]) => `c.${k} = $${k}`).join(", ");
          await run(`MATCH (c:Commission {commissionId: $id}) SET ${setClauses}`,
            { id: params.id, ...Object.fromEntries(updates) });
        }
        return new Response(JSON.stringify({ ok: true }), { headers: CORS });
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), { status: 400, headers: CORS });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS });
  }
}
