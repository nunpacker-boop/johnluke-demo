import { useState } from "react";
import { Link } from "react-router-dom";

// ── Data ──────────────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    id: "catalogue",
    title: "Catalogue & Classification",
    intro: "How works are identified, classified, and presented within the John Luke Foundation catalogue.",
    terms: [
      {
        term: "Catalogue Raisonné",
        abbr: null,
        body: "A complete, scholarly listing of all known works by an artist, documenting every painting, drawing, print, and sculpture with full provenance, exhibition history, and physical description. The John Luke Foundation's Living Catalogue Raisonné is a continuously evolving record — non-final by design, updated as new works are discovered or re-attributed.",
      },
      {
        term: "Selected Catalogue",
        abbr: null,
        body: "A curated subset of the full catalogue comprising completed, exhibited works of major significance. Works appear in the Selected Catalogue on the basis of completeness, exhibition provenance, and art-historical importance. Studies, preparatory sketches, test prints, and unfinished works are generally excluded, though they may appear in the full catalogue and may be linked to Selected Catalogue entries as related works.",
      },
      {
        term: "Catalogue Number",
        abbr: "e.g. JL-084",
        body: "Each work is assigned a unique catalogue number in the form JL-NNN, allocated sequentially as works enter the catalogue. The number is permanent and does not imply a chronological sequence — early catalogue numbers may correspond to works discovered or attributed after later ones. Where a work has a legacy reference number from an earlier catalogue or exhibition list, this is preserved in the record.",
      },
      {
        term: "Primary Work",
        abbr: null,
        body: "A completed, independent work — painting, print, sculpture, or finished drawing — intended as a finished statement. Distinguished from studies and preparatory works, which are classified separately. All primary works are eligible for the Selected Catalogue; not all primary works are included.",
      },
      {
        term: "Study",
        abbr: null,
        body: "A preparatory or exploratory work — a sketch, compositional study, colour study, or figure study — made in connection with or in advance of a primary work. Studies are catalogued and given full records, but appear in a separate band on the Selected Catalogue timeline. Where the relationship between a study and a primary work is established, both records carry a cross-reference.",
      },
      {
        term: "Version",
        abbr: null,
        body: "A second or subsequent treatment of the same subject or composition, produced independently and at the same level of finish as the primary work. Versions are peer works rather than preparatory works, and both carry full catalogue records. Where two versions are identified, each record links to the other.",
      },
      {
        term: "Attributed",
        abbr: null,
        body: "A work believed, on stylistic or documentary grounds, to be by John Luke but lacking definitive proof of authorship. Attribution is noted explicitly in the catalogue record and may be revised as evidence emerges.",
      },
      {
        term: "Lost Work",
        abbr: null,
        body: "A work whose existence is documented — through exhibition records, correspondence, photographs, or auction listings — but whose current location is unknown. Lost works are catalogued with the available evidence and marked accordingly.",
      },
    ],
  },
  {
    id: "medium",
    title: "Medium",
    intro: "The primary material or materials with which a work is made. The Foundation uses a controlled vocabulary of 19 medium values to ensure consistency across the catalogue.",
    terms: [
      {
        term: "Oil",
        abbr: null,
        body: "Oil paint — pigment bound in linseed, walnut, or poppy oil — applied to canvas, board, or panel. Luke's early works are predominantly oil, before his move toward tempera and oil-and-tempera in the 1930s.",
      },
      {
        term: "Oil and Tempera",
        abbr: null,
        body: "Luke's characteristic mature medium from the early 1930s onward. Egg tempera, made from pigment mixed with egg yolk, is applied in thin, translucent layers, frequently over an oil underpainting or combined with oil glazes. The combination allows the luminosity and precision of tempera with the tonal range of oil. This is the medium of Luke's most important exhibited works.",
      },
      {
        term: "Tempera",
        abbr: null,
        body: "Pure egg tempera — pigment bound with egg yolk and water — without oil additions. A demanding medium requiring application in fine hatched or stippled strokes; it dries rapidly, cannot be blended on the surface, and produces a characteristic matt, jewel-like finish.",
      },
      {
        term: "Watercolour",
        abbr: null,
        body: "Transparent watercolour on paper, frequently applied over a pencil underdrawing. Some works listed in earlier sources as 'watercolour drawings' or 'watercolour over pencil' are catalogued as Watercolour, with any underdrawing noted in the record.",
      },
      {
        term: "Gouache",
        abbr: "Also: bodycolour",
        body: "Opaque watercolour — pigment bound with gum arabic and chalk or white pigment to produce an opaque, mat finish. Sometimes referred to as bodycolour in older catalogue sources. Distinguished from watercolour by its opacity.",
      },
      {
        term: "Pastel",
        abbr: null,
        body: "Dry pigment sticks applied to paper. Luke used pastel primarily as a sketching and compositional medium rather than a finished exhibition medium.",
      },
      {
        term: "Pencil",
        abbr: null,
        body: "Graphite pencil on paper. Represents the largest single category in the catalogue, reflecting Luke's extensive practice of drawing from life, landscape observation, and compositional development. Includes works on tracing paper and works with minor watercolour or bodycolour additions where pencil is the primary medium.",
      },
      {
        term: "Coloured Pencil",
        abbr: null,
        body: "Wax or oil-bound coloured pencils on paper. Distinct from conté crayon and pastel.",
      },
      {
        term: "Conté",
        abbr: "Conté crayon",
        body: "A compressed chalk and graphite drawing medium in stick form, typically used in black, white, sanguine (red-brown), or bistre (brown). Harder and cleaner than charcoal, with a characteristic velvety line. Luke used conté for figure drawing and detailed studies.",
      },
      {
        term: "Charcoal",
        abbr: null,
        body: "Charred wood applied to paper. Luke used charcoal for life drawing, figure studies, and compositional sketching.",
      },
      {
        term: "Charcoal and Watercolour Wash",
        abbr: null,
        body: "Charcoal drawing with watercolour wash added for tone or colour. A combined medium with distinct visual character, catalogued separately from pure charcoal or pure watercolour works.",
      },
      {
        term: "Pen and Ink with Wash",
        abbr: null,
        body: "Pen and ink line drawing with an added wash — either ink wash or watercolour wash — for tone. Some works in earlier sources are listed as 'pen and ink over pencil' or simply 'ink on paper'; where wash is present or likely, these are catalogued under this term.",
      },
      {
        term: "Linocut",
        abbr: null,
        body: "A relief print made from a carved linoleum block, inked and pressed onto paper. Luke's known linocuts are printed on Japanese rice paper, producing a characteristic translucent, fibrous surface that interacts distinctively with the ink.",
      },
      {
        term: "Woodcut",
        abbr: "Also: woodblock print",
        body: "A relief print made from a carved wood block. Luke's woodcuts include coloured examples (using multiple blocks or hand-colouring). Some earlier catalogue sources use the term 'woodblock print'; these are catalogued uniformly as Woodcut.",
      },
      {
        term: "Encaustic",
        abbr: "Oil and wax",
        body: "Pigment mixed with hot wax, applied to a rigid support. Some works in earlier sources are listed as 'oil and wax'; where this is consistent with encaustic technique, they are catalogued accordingly.",
      },
      {
        term: "Distemper",
        abbr: null,
        body: "Pigment mixed with glue size (animal glue and water), historically used for wall painting and large decorative schemes. A matt, powdery medium. Luke's distemper work is associated with his mural commissions.",
      },
      {
        term: "Sculpture",
        abbr: null,
        body: "Three-dimensional works in stone. Luke's known sculptures include works in bathstone and yorkstone. The stone type and any relevant provenance notes are preserved in the medium notes field of the catalogue record.",
      },
      {
        term: "Mixed Media",
        abbr: null,
        body: "Works combining two or more media that cannot be cleanly classified under a single medium term. Used as a cataloguing catchall where the materials are either composite, uncertain, or undocumented. Specific materials are noted in the record where known.",
      },
    ],
  },
  {
    id: "support",
    title: "Support",
    intro: "The physical surface on which a work is made. Recorded separately from medium to allow independent searching and filtering.",
    terms: [
      {
        term: "Canvas",
        abbr: null,
        body: "Woven fabric — typically linen or cotton — stretched over a wooden frame (stretcher) and primed. The traditional support for oil painting.",
      },
      {
        term: "Canvas on board",
        abbr: "Also: canvas laid on board",
        body: "Canvas adhered to a rigid board or panel, sometimes to prevent warping or for ease of transport. Several Luke works have been identified as 'canvas laid on board' in auction and exhibition catalogues.",
      },
      {
        term: "Cotton on board",
        abbr: null,
        body: "Cotton fabric adhered to a rigid board. Distinct from linen on board in texture and weave.",
      },
      {
        term: "Linen on board",
        abbr: null,
        body: "Linen fabric adhered to a rigid board or panel. Used in a number of Luke's oil and tempera works.",
      },
      {
        term: "Board",
        abbr: null,
        body: "A rigid support of cardboard, hardboard, or similar material, primed for painting. Commonly used for smaller-scale oil and tempera works.",
      },
      {
        term: "Panel",
        abbr: null,
        body: "A rigid wooden support — traditionally the support for tempera painting. Distinct from board in referring specifically to prepared wood.",
      },
      {
        term: "Thick card",
        abbr: null,
        body: "Heavy card or millboard used as a painting support. Noted where identified in the catalogue record.",
      },
      {
        term: "Paper",
        abbr: null,
        body: "The standard support for drawings, watercolours, gouache, conté, charcoal, pastel, and prints. Paper type is not routinely recorded in the catalogue unless it is of specific significance.",
      },
      {
        term: "Rice paper",
        abbr: "Japanese rice paper",
        body: "A thin, translucent paper made from the pith of the rice-paper plant, used by Luke as the printing support for his linocuts. Its fibrous, semi-transparent quality gives the printed surface a distinctive character quite different from Western printing papers.",
      },
      {
        term: "Stone",
        abbr: null,
        body: "The material of Luke's known sculptures, including bathstone (a fine-grained oolitic limestone from the Bath area) and yorkstone (a sandstone from Yorkshire).",
      },
    ],
  },
  {
    id: "provenance",
    title: "Provenance & Ownership",
    intro: "How the ownership and exhibition history of works is recorded and described.",
    terms: [
      {
        term: "Provenance",
        abbr: null,
        body: "The documented history of ownership of a work from its creation to the present. Provenance is recorded as a sequence of ownership periods, each with a named owner, approximate dates, and the method by which the work passed from one owner to the next (gift, sale, bequest, etc.). Gaps or uncertainties in the chain are noted explicitly.",
      },
      {
        term: "Certainty",
        abbr: "Confirmed / Probable / Uncertain / Disputed",
        body: "Each ownership period is assigned a certainty level. Confirmed: documented by receipt, deed, or unambiguous contemporary record. Probable: supported by strong circumstantial evidence. Uncertain: some evidence but not conclusive. Disputed: ownership is contested or contradicted by other sources.",
      },
      {
        term: "Current location",
        abbr: null,
        body: "The institution or collection in which a work is currently held, or the designation 'Private collection' where ownership is private. Where a work's location is unknown, this is noted as 'Location unknown'.",
      },
      {
        term: "Auction record",
        abbr: null,
        body: "A documented appearance of a work at public auction, including the auction house, date, lot number, sale price (where known), and whether the work sold or was withdrawn. Auction records are a primary source of provenance evidence and are linked from the artwork's fact sheet.",
      },
    ],
  },
  {
    id: "dating",
    title: "Dating",
    intro: "How dates are assigned and expressed in the catalogue.",
    terms: [
      {
        term: "c. (circa)",
        abbr: null,
        body: "Approximately. Used where a date is inferred from stylistic, contextual, or circumstantial evidence rather than a documentary source. A work dated c.1933 may have been made in 1932–1934; the catalogue record will note the basis for the date.",
      },
      {
        term: "Dated",
        abbr: null,
        body: "A precise date inscribed on the work by the artist, or documented unambiguously in a contemporary source such as an exhibition catalogue, receipt, or letter.",
      },
      {
        term: "Re-dated",
        abbr: null,
        body: "A date revision where the originally received dating has been revised on the basis of new evidence. Re-datings are noted explicitly in the catalogue record with the reason for the revision. Topographical evidence, exhibition records, and correspondence are the primary bases for re-dating.",
      },
      {
        term: "Undated",
        abbr: null,
        body: "A work for which no date has been established and no sufficiently strong basis for inference exists.",
      },
    ],
  },
  {
    id: "condition",
    title: "Condition",
    intro: "How the physical state of works is recorded.",
    terms: [
      {
        term: "Condition grade",
        abbr: "1–5 scale",
        body: "A summary assessment of physical condition on a five-point scale: 1 — Poor (significant damage or loss); 2 — Fair (notable condition issues); 3 — Good (minor issues, stable); 4 — Very Good (sound, minor age-related features only); 5 — Excellent (outstanding preservation). Condition grades are snapshots at a recorded date and may change over time.",
      },
      {
        term: "Condition report",
        abbr: null,
        body: "A detailed written assessment of the physical state of a work, typically produced at the time of sale, exhibition, or conservation examination. Condition reports from auction records are preserved in the catalogue as historical snapshots.",
      },
      {
        term: "Condition snapshot",
        abbr: null,
        body: "A condition record associated with a specific event — typically an auction or exhibition — preserving the state of the work at that moment. Multiple snapshots over time allow changes in condition to be tracked.",
      },
    ],
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function CatalogueTerms() {
  const [activeSection, setActiveSection] = useState(null);
  const [search, setSearch] = useState("");

  const query = search.trim().toLowerCase();

  const filtered = SECTIONS.map(s => ({
    ...s,
    terms: s.terms.filter(t =>
      !query ||
      t.term.toLowerCase().includes(query) ||
      t.body.toLowerCase().includes(query) ||
      (t.abbr || "").toLowerCase().includes(query)
    ),
  })).filter(s => !query || s.terms.length > 0);

  return (
    <main>
      <style>{`
        .ct-layout { display: grid; grid-template-columns: 220px 1fr; gap: 0; align-items: start; }
        @media (max-width: 860px) { .ct-layout { grid-template-columns: 1fr; } }

        /* ── Sidebar nav ── */
        .ct-nav { position: sticky; top: 24px; padding-right: 32px; }
        .ct-nav-title { font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.12em; color: var(--primary); opacity: 0.5; margin-bottom: 12px; }
        .ct-nav-link { display: block; padding: 6px 0; font-size: 0.85rem;
          color: var(--shadow); opacity: 0.5; text-decoration: none;
          border-left: 2px solid transparent; padding-left: 12px; margin-left: -12px;
          transition: all 0.15s; line-height: 1.3; }
        .ct-nav-link:hover { opacity: 0.85; border-left-color: var(--primary); }
        .ct-nav-link.active { opacity: 1; color: var(--primary);
          border-left-color: var(--primary); font-weight: 600; }

        /* ── Search ── */
        .ct-search-wrap { margin-bottom: 40px; }
        .ct-search { width: 100%; padding: 10px 16px; font-size: 0.9rem;
          border: 1px solid var(--light); border-radius: 0.35rem;
          background: white; color: var(--shadow); font-family: inherit;
          outline: none; transition: border-color 0.15s; }
        .ct-search:focus { border-color: var(--primary); }
        .ct-search::placeholder { color: var(--shadow); opacity: 0.35; }

        /* ── Sections ── */
        .ct-section { margin-bottom: 56px; }
        .ct-section-header { margin-bottom: 24px; padding-bottom: 16px;
          border-bottom: 2px solid var(--light); }
        .ct-section-title { font-family: var(--ff-hx); font-size: 1.5rem;
          font-weight: 600; color: var(--shadow); margin: 0 0 8px; }
        .ct-section-intro { font-size: 0.9rem; color: var(--shadow);
          opacity: 0.6; line-height: 1.65; margin: 0; }

        /* ── Term entries ── */
        .ct-terms { display: flex; flex-direction: column; gap: 0; }
        .ct-term { padding: 20px 0; border-bottom: 1px solid var(--light);
          display: grid; grid-template-columns: 220px 1fr; gap: 24px; }
        @media (max-width: 600px) { .ct-term { grid-template-columns: 1fr; gap: 8px; } }
        .ct-term:last-child { border-bottom: none; }
        .ct-term-head { padding-top: 2px; }
        .ct-term-name { font-family: var(--ff-hx); font-size: 1rem; font-weight: 600;
          color: var(--shadow); margin-bottom: 4px; line-height: 1.3; }
        .ct-term-abbr { font-size: 0.75rem; color: var(--primary); opacity: 0.65;
          font-style: italic; }
        .ct-term-body { font-size: 0.9rem; color: var(--shadow); opacity: 0.75;
          line-height: 1.75; }

        /* ── Highlight matched text ── */
        .ct-highlight { background: rgba(21, 89, 129, 0.12);
          border-radius: 2px; padding: 0 2px; }

        /* ── Empty state ── */
        .ct-empty { text-align: center; padding: 60px 20px;
          color: var(--shadow); opacity: 0.4; font-size: 0.9rem; }

        /* ── Print ── */
        @media print {
          .ct-nav, .ct-search-wrap, .aw-print-btn { display: none !important; }
          .ct-layout { grid-template-columns: 1fr !important; }
          .ct-term { grid-template-columns: 180px 1fr; }
        }
      `}</style>

      {/* ── Hero ── */}
      <section className="hero">
        <article>
          <div className="hero-content">
            <div className="preheading">Works · Reference</div>
            <h1>Catalogue Terms &amp; Definitions</h1>
            <p>
              A reference glossary explaining the terminology, classifications, and controlled
              vocabulary used throughout the John Luke Foundation catalogue.
            </p>
            <div className="btn-duo">
              <Link className="cta-primary dull" to="/works">← Works</Link>
            </div>
          </div>
        </article>
      </section>

      <section className="panel light">
        <article>
          <div className="panel-content" style={{ width: "100%" }}>

            {/* Search */}
            <div className="ct-search-wrap">
              <input
                type="search"
                className="ct-search"
                placeholder="Search terms and definitions…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className="ct-layout">

              {/* Sidebar nav — hidden when searching */}
              {!query && (
                <nav className="ct-nav">
                  <div className="ct-nav-title">Contents</div>
                  {SECTIONS.map(s => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className={`ct-nav-link ${activeSection === s.id ? "active" : ""}`}
                      onClick={() => setActiveSection(s.id)}
                    >
                      {s.title}
                    </a>
                  ))}
                </nav>
              )}

              {/* Terms */}
              <div>
                {filtered.length === 0 && (
                  <div className="ct-empty">No terms match "{search}"</div>
                )}
                {filtered.map(section => (
                  <div key={section.id} id={section.id} className="ct-section">
                    <div className="ct-section-header">
                      <h2 className="ct-section-title">{section.title}</h2>
                      <p className="ct-section-intro">{section.intro}</p>
                    </div>
                    <div className="ct-terms">
                      {section.terms.map(t => (
                        <div key={t.term} className="ct-term">
                          <div className="ct-term-head">
                            <div className="ct-term-name">{t.term}</div>
                            {t.abbr && <div className="ct-term-abbr">{t.abbr}</div>}
                          </div>
                          <div className="ct-term-body">{t.body}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
