/**
 * Cloudflare Pages Function: /api/timeline
 *
 * Returns Period nodes (from Neo4j if seeded, otherwise canonical fallback)
 * with their artworks and all exhibitions, ordered chronologically.
 *
 * Three-tier behaviour:
 *   1. Neo4j has Period nodes → use them with their linked artworks
 *   2. Neo4j has no Period nodes → use canonical periods, populate artworks by year range
 *   3. DB unavailable or error → canonical periods with empty artwork arrays
 */

// ── Canonical period definitions — source: Hewitt (1978) & McBrinn (2012) ────
const CANONICAL_PERIODS = [
  {
    name:      "North Belfast & The Art School",
    shortName: "Early Belfast",
    yearFrom:  1906,
    yearTo:    1927,
    colour:    "#8B3A2A",
    description: "Born 16 January 1906 at Lewis Street, north Belfast, into a working-class linen and shipyard family. Worked at Workman & Clark's shipyard as a heater-boy until a badly fractured leg ended that. Discovered the Belfast School of Art around 1923 on the advice of an older workmate. Evening classes became full-time study. Won prize after prize in figure drawing, anatomy, design and modelling. Formed deep friendships with Toogood, Knox, Galloway and MacCann. Awarded the Dunville Scholarship of £100 per annum in 1927.",
    artworks:  [],
  },
  {
    name:      "London & The Slade",
    shortName: "The Slade",
    yearFrom:  1927,
    yearTo:    1931,
    colour:    "#2C3E6B",
    description: "Enrolled at the Slade School of Fine Art on 4 October 1927 under Henry Tonks. In the same class as Coldstream, Moynihan and Ithell Colquhoun. Drew from the Parthenon frieze at the British Museum. Shared studio with F.E. McWilliam in Nevinson's old space. Won the Robert Ross Scholarship 1930. Learned wood engraving at Westminster. Completed a Piccadilly travel mural. Exhibited at the Leger Gallery 1930 and 1931. Returned to Belfast end of 1931, driven home by the Depression.",
    artworks:  [],
  },
  {
    name:      "Return to Belfast & Discovery of Tempera",
    shortName: "Discovery of Tempera",
    yearFrom:  1932,
    yearTo:    1940,
    colour:    "#2D5A3D",
    description: "Met John Hewitt early 1932 — the three-way conversation with Hewitt and McClughin on art, technique and philosophy that would run for a decade. Brief Cézanne phase, then first tempera painting County Down / Landscape (1933). Ulster Unit exhibition December 1934. Achill trips with Alan Stewart 1935. The decisive break came with The Bridge (1936): searing spectral colours and visionary intensity. From The Fox (1937) on, Luke painted exclusively in tempera. Slievemore (1935) was selected for the 1939 New York World's Fair.",
    artworks:  [],
  },
  {
    name:      "Knappagh & The Visionary Decade",
    shortName: "Knappagh",
    yearFrom:  1941,
    yearTo:    1950,
    colour:    "#7A5C1E",
    description: "The Easter Tuesday Blitz of 15 April 1941 forced Luke and his mother to Knappagh Farm, Killylea, Co. Armagh. The ten major tempera paintings that define his reputation all came from this single decade: Pax, The Road to the West, The Old Callan Bridge, The Three Dancers, Northern Rhythm, The Dancer and the Bubble, Madonna and Child, The Rehearsal. First solo exhibition Belfast Museum 1946. Of Northern Rhythm Luke wrote: 'No painting has so much or so deeply expressed my own particular type or state of mind and spirit.' Returned to Belfast late 1950. Hewitt: 'So ended the Knappagh period — his last easel paintings behind him.'",
    artworks:  [],
  },
  {
    name:      "The Mural Years",
    shortName: "Murals",
    yearFrom:  1951,
    yearTo:    1969,
    colour:    "#3D3D3D",
    description: "Commissioned to paint a mural in Belfast City Hall to commemorate the Festival of Britain. Begun January 1951, working twelve-hour days in bitter cold high on scaffolding under the dome. Completed May 1952 — the Queen offered warm congratulations. Provincial Masonic Hall, Solomon and the Temple (1955–56). Coat of Arms for Lord Wakehurst at Hillsborough (1959) and Lord Erskine (1969). Began teaching at Belfast College of Art 1954. Last solo exhibition 1960. Millfield mural begun 1961 — a futuristic vision of the city, never completed.",
    artworks:  [],
  },
  {
    name:      "Late Years, Teaching & The Writings",
    shortName: "Late Years",
    yearFrom:  1960,
    yearTo:    1975,
    colour:    "#1A1A1A",
    description: "Met Patric Coogan around 1960 — their friendship deepened into the closest of his final years. Increasing deafness, declining health. Extraordinary austerity in the Westland Bungalow — stacked newspapers, no curtains, no colour in the living space. Written notes on drawing and form began to dominate his days, approaching Zen koan in quality. Coogan: 'He was a man who knew just how beautiful the void is.' Moved to 240 Duncairn Gardens. Millfield mural visited occasionally in the early 1970s — two or three brushstrokes an evening, then the long walk home through a troubled city. Died 4 February 1975. The mural unfinished.",
    artworks:  [],
  },
];

export async function onRequestGet({ request, env }) {
  const cors = {
    "Access-Control-Allow-Origin":  "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (request.method === "OPTIONS") return new Response(null, { headers: cors });

  // No DB configured — return canonical periods with empty artworks
  if (!env.NEO4J_URI || !env.NEO4J_USER || !env.NEO4J_PASSWORD) {
    return new Response(
      JSON.stringify({ periods: CANONICAL_PERIODS, exhibitions: [], source: "fallback" }),
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
    // ── Run queries in parallel ──────────────────────────────────────────────
    const [dbPeriods, allArtworks, exhibitions] = await Promise.all([

      // Periods with linked artworks
      runQuery(`
        MATCH (p:Period)
        OPTIONAL MATCH (w:Artwork)-[:CREATED_IN]->(p)
        WHERE w.yearFrom IS NOT NULL
        WITH p,
          collect(DISTINCT CASE WHEN w IS NOT NULL THEN {
            artworkId:    w.artworkId,
            title:        w.title,
            dateText:     w.dateText,
            yearFrom:     w.yearFrom,
            yearTo:       w.yearTo,
            medium:       w.medium,
            thumbnailUrl: w.thumbnailUrl,
            imageUrl:     w.imageUrl,
            selected:     coalesce(w.selectedCatalogue, false)
          } ELSE null END) AS allWorks
        RETURN
          p.name        AS name,
          p.shortName   AS shortName,
          p.yearFrom    AS yearFrom,
          p.yearTo      AS yearTo,
          p.description AS description,
          p.colour      AS colour,
          [w IN allWorks WHERE w IS NOT NULL] AS artworks
        ORDER BY p.yearFrom ASC
      `),

      // All dated artworks (for fallback period assignment)
      runQuery(`
        MATCH (w:Artwork)
        WHERE w.yearFrom IS NOT NULL
        RETURN
          w.artworkId    AS artworkId,
          w.title        AS title,
          w.dateText     AS dateText,
          w.yearFrom     AS yearFrom,
          w.yearTo       AS yearTo,
          w.medium       AS medium,
          w.thumbnailUrl AS thumbnailUrl,
          w.imageUrl     AS imageUrl,
          coalesce(w.selectedCatalogue, false) AS selected
        ORDER BY w.yearFrom ASC
      `),

      // All exhibitions with a year
      runQuery(`
        MATCH (ex:Exhibition)
        WHERE ex.yearFrom IS NOT NULL
        RETURN
          ex.exhibitionId   AS exhibitionId,
          ex.title          AS title,
          ex.yearText       AS yearText,
          ex.yearFrom       AS yearFrom,
          ex.venue          AS venue,
          ex.exhibitionType AS exhibitionType
        ORDER BY ex.yearFrom ASC
      `),
    ]);

    let periods;
    let source;

    if (dbPeriods.length > 0) {
      // Neo4j has Period nodes — use them, enriching yearFrom/yearTo if absent
      source  = "neo4j";
      periods = dbPeriods.map(p => ({
        ...p,
        yearFrom: p.yearFrom ?? Math.min(...(p.artworks || []).map(w => w.yearFrom).filter(Boolean), 9999),
        yearTo:   p.yearTo   ?? Math.max(...(p.artworks || []).map(w => w.yearFrom).filter(Boolean), 0),
      }));
    } else {
      // No Period nodes yet — use canonical definitions, populate artworks by year range
      source  = "fallback+artworks";
      periods = CANONICAL_PERIODS.map(p => ({
        ...p,
        artworks: allArtworks.filter(w =>
          w.yearFrom >= p.yearFrom && w.yearFrom <= p.yearTo
        ),
      }));
    }

    return new Response(
      JSON.stringify({ periods, exhibitions, source }),
      { headers: cors }
    );

  } catch (err) {
    // DB error — return canonical periods, no artworks
    return new Response(
      JSON.stringify({
        periods:      CANONICAL_PERIODS,
        exhibitions:  [],
        source:       "error-fallback",
        error:        err.message,
      }),
      { headers: cors }
    );
  }
}
