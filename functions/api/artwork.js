/**
 * Cloudflare Pages Function: /api/artwork
 * ?id=artwork-jl-084
 *
 * Returns full artwork detail including exhibition history,
 * ownership periods, and related techniques/periods.
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
  const id  = (url.searchParams.get("id") || "").trim();

  if (!id) {
    return new Response(JSON.stringify({ error: "No artwork id provided" }), { status: 400, headers: cors });
  }

  const cypher = `
    MATCH (w:Artwork {artworkId: $id})

    // Techniques
    OPTIONAL MATCH (w)-[:USES_TECHNIQUE]->(t:Technique)

    // Period
    OPTIONAL MATCH (w)-[:CREATED_IN]->(p:Period)

    // Exhibitions (with relationship properties for catalogue context)
    OPTIONAL MATCH (ex:Exhibition)-[exr:INCLUDES_ARTWORK]->(w)

    // Ownership periods
    OPTIONAL MATCH (w)-[op:OWNED_BY]->(o:Owner)

    // Studies of this work (w is the primary)
    OPTIONAL MATCH (study:Artwork)-[:STUDY_FOR]->(w)

    // Primary work this is a study for (w is the study)
    OPTIONAL MATCH (w)-[:STUDY_FOR]->(primary:Artwork)

    // Related versions (peer relationship, bidirectional)
    OPTIONAL MATCH (w)-[:RELATED_VERSION]->(version:Artwork)

    WITH w,
      collect(DISTINCT t.name)  AS techniques,
      collect(DISTINCT p.name)  AS periods,
      collect(DISTINCT CASE WHEN study IS NOT NULL THEN {
        artworkId:    study.artworkId,
        title:        study.title,
        dateText:     study.dateText,
        medium:       study.medium,
        thumbnailUrl: study.thumbnailUrl,
        imageUrl:     study.imageUrl
      } ELSE null END) AS studiesRaw,
      CASE WHEN primary IS NOT NULL THEN {
        artworkId:    primary.artworkId,
        title:        primary.title,
        dateText:     primary.dateText,
        medium:       primary.medium,
        thumbnailUrl: primary.thumbnailUrl,
        imageUrl:     primary.imageUrl
      } ELSE null END AS primaryWork,
      collect(DISTINCT CASE WHEN version IS NOT NULL THEN {
        artworkId:    version.artworkId,
        title:        version.title,
        dateText:     version.dateText,
        medium:       version.medium,
        thumbnailUrl: version.thumbnailUrl,
        imageUrl:     version.imageUrl
      } ELSE null END) AS versionsRaw,
      collect(DISTINCT CASE WHEN ex IS NOT NULL THEN {
        exhibitionId:    ex.exhibitionId,
        title:           ex.title,
        yearText:        ex.yearText,
        venue:           ex.venue,
        exhibitionType:  ex.exhibitionType,
        catalogueNumber: exr.catalogueNumber,
        roomOrGallery:   exr.roomOrGallery,
        salePrice:       exr.salePrice,
        sold:            exr.sold,
        catalogueNotes:  exr.catalogueNotes
      } ELSE null END) AS exhibitionsRaw,
      collect(DISTINCT CASE WHEN o IS NOT NULL THEN {
        ownerName:     o.name,
        ownerType:     o.type,
        ownerLocation: o.location,
        fromYear:      op.fromYear,
        toYear:        op.toYear,
        method:        op.method,
        price:         op.price,
        certainty:     op.certainty,
        source:        op.source,
        notes:         op.notes
      } ELSE null END) AS ownershipRaw

    RETURN
      w.artworkId        AS artworkId,
      w.title            AS title,
      w.dateText         AS dateText,
      w.yearFrom         AS yearFrom,
      w.yearTo           AS yearTo,
      w.medium           AS medium,
      w.dimensionsText   AS dimensions,
      w.currentLocation  AS location,
      w.imageUrl         AS imageUrl,
      w.thumbnailUrl     AS thumbnailUrl,
      w.legacyRef        AS legacyRef,
      w.description      AS description,
      w.notes            AS notes,
      techniques,
      periods,
      [e IN exhibitionsRaw WHERE e IS NOT NULL]  AS exhibitions,
      [o IN ownershipRaw  WHERE o IS NOT NULL]   AS ownership,
      [s IN studiesRaw   WHERE s IS NOT NULL]    AS studies,
      [v IN versionsRaw  WHERE v IS NOT NULL]    AS versions,
      primaryWork,
      coalesce(w.timelineVisible, true)          AS timelineVisible,
      coalesce(w.isStudy, false)                 AS isStudy,
      coalesce(w.selectedCatalogue, false)       AS selectedCatalogue,
      w.theme                                    AS theme
  `;

  let raw;
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type":  "application/json",
        "Accept":        "application/json",
      },
      body: JSON.stringify({ statement: cypher, parameters: { id } }),
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

  const artwork = rows[0] || null;
  return new Response(JSON.stringify({ artwork }), { headers: cors });
}

/**
 * PATCH /api/artwork?id=artwork-jl-XXX
 * Updates specific fields on an Artwork node.
 * Accepts JSON body with any subset of allowed fields.
 * Currently supports: timelineVisible, isStudy, selectedCatalogue,
 *   title, dateText, yearFrom, yearTo, medium, support, notes, description
 */
export async function onRequestPatch({ request, env }) {
  const cors = {
    "Access-Control-Allow-Origin":  "*",
    "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (request.method === "OPTIONS") return new Response(null, { headers: cors });

  if (!env.NEO4J_URI || !env.NEO4J_USER || !env.NEO4J_PASSWORD) {
    return new Response(JSON.stringify({ error: "Database not configured." }), { status: 503, headers: cors });
  }

  const url = new URL(request.url);
  const id  = (url.searchParams.get("id") || "").trim();
  if (!id) return new Response(JSON.stringify({ error: "No artwork id" }), { status: 400, headers: cors });

  let body;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers: cors });
  }

  // Whitelist of fields that can be updated via this endpoint
  const ALLOWED = new Set([
    "timelineVisible", "isStudy", "selectedCatalogue",
    "title", "dateText", "yearFrom", "yearTo", "dateUncertain",
    "medium", "support", "mediumNotes", "notes", "description",
    "currentLocation", "dimensionsText", "heightCm", "widthCm",
  ]);

  const updates = Object.entries(body).filter(([k]) => ALLOWED.has(k));
  if (!updates.length) return new Response(JSON.stringify({ error: "No valid fields to update" }), { status: 400, headers: cors });

  // Build SET clause with named parameters
  const setClauses = updates.map(([k]) => `w.${k} = $${k}`).join(", ");
  const params = Object.fromEntries(updates);

  const host       = env.NEO4J_URI.replace(/^neo4j\+s:\/\//, "https://").replace(/^neo4j:\/\//, "http://").replace(/\/$/, "");
  const endpoint   = `${host}/db/neo4j/query/v2`;
  const credentials = btoa(`${env.NEO4J_USER}:${env.NEO4J_PASSWORD}`);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Basic ${credentials}`,
    },
    body: JSON.stringify({
      statement: `MATCH (w:Artwork {artworkId: $id}) SET ${setClauses} RETURN w.artworkId AS id, ${updates.map(([k]) => `w.${k} AS ${k}`).join(", ")}`,
      parameters: { id, ...params },
    }),
  });

  const data = await res.json();
  if (data.errors?.length) {
    return new Response(JSON.stringify({ error: data.errors[0].message }), { status: 500, headers: cors });
  }

  const row = data?.data?.values?.[0];
  if (!row) return new Response(JSON.stringify({ error: "Artwork not found" }), { status: 404, headers: cors });

  return new Response(JSON.stringify({ ok: true, updated: Object.fromEntries(updates.map(([k], i) => [k, row[i + 1]])) }), { headers: cors });
}
