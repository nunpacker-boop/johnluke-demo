import { useState, useEffect, useCallback } from "react";
import { useSession } from "../../hooks/useSession.jsx";
import { Link, useParams } from "react-router-dom";

// ── Helpers ───────────────────────────────────────────────────────────────────
function cleanYear(v) {
  return v ? String(v).replace(/\.0$/, "") : null;
}

function today() {
  return new Date().toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric"
  });
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

// ── Citation generator ────────────────────────────────────────────────────────
function buildCitations(w, url) {
  if (!w) return {};
  const title   = w.title || "Untitled";
  const year    = cleanYear(w.dateText) || "n.d.";
  const medium  = w.medium || "";
  const loc     = w.location || "";
  const site    = "John Luke Foundation Catalogue";
  const org     = "John Luke Foundation";
  const access  = today();
  const fullUrl = url;

  // Catalogue number for institutional reference
  const catNo = w.artworkId ? w.artworkId.replace("artwork-", "").toUpperCase() : null;
  const locPart = [loc, catNo ? `cat. no. ${catNo}` : null].filter(Boolean).join(", ");

  const chicago = `${org}. "${title}," ${year}. ${medium}${medium && locPart ? ". " : ""}${locPart}. In *${site}*. Accessed ${access}. ${fullUrl}.`;

  const mla = `${org}. "${title}." *${site}*, ${new Date().getFullYear()}, ${fullUrl}. Accessed ${todayISO()}.`;

  const plainUrl = `${org} — "${title}" (${year})\n${site}\n${fullUrl}\nAccessed: ${access}`;

  return { chicago, mla, plainUrl };
}

// ── Copy-to-clipboard button ──────────────────────────────────────────────────
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handle = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);
  return (
    <button className="cite-copy" onClick={handle}>
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

// ── Citations panel ───────────────────────────────────────────────────────────
function CitationsPanel({ artwork }) {
  const [active, setActive] = useState("chicago");
  const url = typeof window !== "undefined" ? window.location.href : "";
  const cites = buildCitations(artwork, url);

  const TABS = [
    { id: "chicago",  label: "Chicago" },
    { id: "mla",      label: "MLA" },
    { id: "plainUrl", label: "URL" },
  ];

  const NOTE = {
    chicago:  "Chicago notes & bibliography style. Use for academic papers, catalogues, and art history writing.",
    mla:      "MLA 9th edition. Use for humanities essays and literary studies contexts.",
    plainUrl: "Plain reference for journalists, bloggers, and general use.",
  };

  return (
    <div className="cite-panel">
      <div className="cite-header">
        <div className="cite-title">Cite this record</div>
        <div className="cite-note">{NOTE[active]}</div>
      </div>
      <div className="cite-tabs">
        {TABS.map(t => (
          <button key={t.id}
            className={`cite-tab ${active === t.id ? "active" : ""}`}
            onClick={() => setActive(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="cite-body">
        <div className="cite-text">{cites[active]}</div>
        <CopyButton text={cites[active]} />
      </div>
      <div className="cite-footer">
        All records published by the John Luke Foundation. Citations should acknowledge
        the Foundation as the authoritative source for this catalogue.
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ArtworkFactSheet() {
  const { artworkId } = useParams();
  const [artwork, setArtwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [imgErr, setImgErr]   = useState(false);

  useEffect(() => {
    if (!artworkId) return;
    fetch(`/api/artwork?id=${encodeURIComponent(artworkId)}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        if (!d.artwork) throw new Error("Artwork not found");
        setArtwork(d.artwork);
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [artworkId]);

  // Session-based timeline visibility (per-visitor, not global)
  const { isHidden, setTimelineVisible, isReady: sessionReady, isSaving } = useSession();
  const [tlMsg, setTlMsg] = useState(null);

  const tlHidden  = artworkId ? isHidden(artworkId) : false;
  const tlVisible = !tlHidden;

  const toggleTimelineVisible = () => {
    if (!artworkId || isSaving) return;
    const next = !tlVisible;
    setTimelineVisible(artworkId, next);
    setTlMsg(next ? "Shown on your timeline" : "Hidden from your timeline");
    setTimeout(() => setTlMsg(null), 2500);
  };

  const w = artwork;
  const image = w?.imageUrl || w?.thumbnailUrl;

  // Archive excerpts — split by access tier
  // TODO: wire isResearcher to actual auth when researcher accounts are built
  const isResearcher = false;
  const publicExcerpts     = (w?.excerpts || []).filter(e => e.accessTier === "public");
  const researchExcerpts   = (w?.excerpts || []).filter(e => e.accessTier === "researcher");
  const hasArchiveContent  = publicExcerpts.length > 0 || researchExcerpts.length > 0;
  const id = w?.artworkId ? w.artworkId.replace("artwork-", "").toUpperCase() : null;

  const exhibitions = (w?.exhibitions || [])
    .slice()
    .sort((a, b) => (a.yearText || "").localeCompare(b.yearText || ""));

  const ownership = (w?.ownership || [])
    .slice()
    .sort((a, b) => (a.fromYear || 0) - (b.fromYear || 0));

  const CERTAINTY_CLASS = {
    confirmed: "cert-confirmed",
    probable:  "cert-probable",
    uncertain: "cert-uncertain",
    disputed:  "cert-disputed",
  };

  return (
    <main>
      {/* ─────────────────────── SCREEN STYLES ─────────────────────────── */}
      <style>{`
        /* ── Breadcrumb ── */
        .aw-breadcrumb { color:rgba(255,255,255,0.6); text-decoration:none; }
        .aw-breadcrumb:hover { color:white; }

        /* ── Print button ── */
        .aw-print-btn { display:inline-flex; align-items:center; gap:6px; padding:7px 16px;
          border:1px solid rgba(255,255,255,0.3); border-radius:0.25rem;
          background:transparent; color:rgba(255,255,255,0.8); font-size:0.82rem;
          cursor:pointer; transition:all 0.15s; margin-top:16px; font-family:inherit; }
        .aw-print-btn:hover { background:rgba(255,255,255,0.1); color:white; border-color:rgba(255,255,255,0.6); }

        /* ── Description ── */
        .aw-description { max-width:760px; margin:0 auto 40px; }
        .aw-description-label { font-size:0.72rem; font-weight:700; text-transform:uppercase;
          letter-spacing:0.08em; color:var(--primary); opacity:0.6;
          padding-bottom:10px; border-bottom:1px solid var(--light); margin-bottom:18px; }
        .aw-description-text { font-size:1rem; line-height:1.8; color:var(--shadow); }
        .aw-description-text p { margin:0 0 1.2em; }
        .aw-description-text p:last-child { margin-bottom:0; }

        /* ── Two-column layout ── */
        .aw-layout { display:grid; grid-template-columns:1fr 1fr; gap:40px; align-items:start; }
        @media (max-width:800px) { .aw-layout { grid-template-columns:1fr; } }

        /* ── Image ── */
        .aw-image-frame { background:#f0ede8; border-radius:0.35rem; overflow:hidden;
          position:sticky; top:24px; }
        .aw-img-wrap { position:relative; }
        .aw-img-wrap img { width:100%; height:auto; display:block;
          pointer-events:none; user-select:none; -webkit-user-drag:none; }
        .aw-img-shield { position:absolute; inset:0; z-index:2; }
        .aw-img-placeholder { display:flex; flex-direction:column; align-items:center;
          justify-content:center; gap:8px; color:#b0a898; padding:60px 40px; text-align:center; }
        .aw-img-placeholder span { font-size:2.5rem; font-family:monospace; }
        .aw-img-placeholder p { font-size:0.82rem; margin:0; }

        /* ── Detail sections ── */
        .aw-detail-col { display:flex; flex-direction:column; gap:28px; }
        .aw-section { display:flex; flex-direction:column; gap:10px; }
        .aw-section-label { font-size:0.72rem; font-weight:700; text-transform:uppercase;
          letter-spacing:0.08em; color:var(--primary); opacity:0.6;
          padding-bottom:8px; border-bottom:1px solid var(--light); }

        /* ── Definition list ── */
        .aw-dl { display:grid; grid-template-columns:auto 1fr; gap:6px 20px; font-size:0.9rem; }
        .aw-dl dt { color:var(--shadow); opacity:0.45; font-weight:600; font-size:0.76rem;
          text-transform:uppercase; letter-spacing:0.04em; padding-top:2px; white-space:nowrap; }
        .aw-dl dd { color:var(--shadow); margin:0; line-height:1.5; }
        .aw-id-val { font-family:monospace; font-weight:700; color:var(--primary); font-size:0.85rem; }

        /* ── Exhibition history ── */
        .aw-ex-list { display:flex; flex-direction:column; gap:10px; }
        .aw-ex-item { display:grid; grid-template-columns:48px 1fr; gap:12px; font-size:0.88rem; }
        .aw-ex-year { color:var(--shadow); opacity:0.4; font-weight:600; font-size:0.8rem; padding-top:2px; }
        .aw-ex-link { color:var(--primary); text-decoration:none; font-weight:500; font-family:var(--ff-hx); }
        .aw-ex-link:hover { text-decoration:underline; }
        .aw-ex-meta { display:flex; flex-wrap:wrap; gap:4px 10px; font-size:0.78rem;
          color:var(--shadow); opacity:0.55; margin-top:2px; }
        .aw-ex-catnotes { font-size:0.78rem; color:var(--shadow); opacity:0.5;
          font-style:italic; margin-top:2px; }

        /* ── Ownership ── */
        .aw-own-list { display:flex; flex-direction:column; gap:12px; }
        .aw-own-item { display:grid; grid-template-columns:80px 1fr; gap:12px; font-size:0.88rem; }
        .aw-own-years { color:var(--shadow); opacity:0.4; font-size:0.78rem;
          font-weight:600; padding-top:2px; line-height:1.4; }
        .aw-own-present { color:#2d6a4f; font-weight:700; }
        .aw-own-name { font-weight:600; color:var(--shadow); font-family:var(--ff-hx); margin-bottom:3px; }
        .aw-own-meta { display:flex; flex-wrap:wrap; gap:4px 8px; font-size:0.78rem;
          color:var(--shadow); opacity:0.55; margin-bottom:3px; }
        .aw-own-source { font-size:0.76rem; color:var(--shadow); opacity:0.45; font-style:italic; }
        .aw-own-notes  { font-size:0.76rem; color:#ae6818; margin-top:2px; }

        /* ── Related works ── */
        .aw-related { max-width:760px; margin:0 auto 40px; }
        .aw-related-label { font-size:0.72rem; font-weight:700; text-transform:uppercase;
          letter-spacing:0.1em; color:var(--shadow); opacity:0.5; margin-bottom:16px;
          padding-bottom:6px; border-bottom:1px solid var(--light); }
        .aw-related-grid { display:flex; flex-wrap:wrap; gap:16px; }
        .aw-related-card { display:flex; gap:12px; align-items:flex-start;
          background:rgba(0,0,0,0.02); border:1px solid var(--light);
          border-radius:6px; padding:10px 12px; text-decoration:none;
          color:inherit; transition:border-color 0.15s; flex:1; min-width:240px; max-width:360px; }
        .aw-related-card:hover { border-color:var(--primary); }
        .aw-related-thumb { width:56px; height:56px; object-fit:cover; border-radius:3px; flex-shrink:0; background:var(--light); display:block; }
        .aw-related-thumb-ph { width:56px; height:56px; border-radius:3px; flex-shrink:0;
          background:var(--light); display:flex; align-items:center; justify-content:center;
          font-size:0.6rem; color:var(--shadow); }
        .aw-related-info { flex:1; min-width:0; }
        .aw-related-rel { font-size:0.65rem; font-weight:700; text-transform:uppercase;
          letter-spacing:0.09em; color:var(--shadow); opacity:0.55; margin-bottom:3px; }
        .aw-related-title { font-family:var(--serif); font-size:0.9rem; line-height:1.3; margin-bottom:2px; }
        .aw-related-meta { font-size:0.75rem; color:var(--shadow); opacity:0.7; }

        /* ── Certainty badges ── */
        .cert-badge { display:inline-block; padding:1px 7px; border-radius:2rem;
          font-size:0.68rem; font-weight:600; text-transform:uppercase; letter-spacing:0.04em; }
        .cert-confirmed { background:#e8f5e2; color:#2d6a4f; }
        .cert-probable  { background:#fdf3e0; color:#ae6818; }
        .cert-uncertain { background:#f0f0f0; color:#6a6a6a; }
        .cert-disputed  { background:#fde8e8; color:#9b2226; }

        /* ── From the archive ── */
        .aw-archive { max-width: 760px; margin: 0 auto 40px; }
        .aw-archive-label { font-size:0.72rem; font-weight:700; text-transform:uppercase;
          letter-spacing:0.1em; color:var(--shadow); opacity:0.45; margin-bottom:16px; }
        .aw-excerpt {
          border-left: 3px solid var(--primary);
          padding: 0 0 0 20px; margin-bottom: 24px;
        }
        .aw-excerpt-text {
          font-family: Georgia, serif; font-style: italic;
          font-size: 0.96rem; line-height: 1.8; color: var(--shadow);
          margin: 0 0 10px;
        }
        .aw-excerpt-meta {
          font-size: 0.72rem; color: var(--shadow); opacity: 0.55;
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
        }
        .aw-excerpt-source { font-weight: 600; }
        .aw-excerpt-doc-link {
          color: var(--primary); text-decoration: none; font-size: 0.72rem;
        }
        .aw-excerpt-doc-link:hover { text-decoration: underline; }
        .aw-excerpt-confidence {
          display: inline-block; padding: 1px 7px; border-radius: 8px;
          font-size: 0.62rem; letter-spacing: 0.06em; text-transform: uppercase;
          background: rgba(0,0,0,0.06);
        }
        .aw-archive-teaser {
          padding: 16px 20px;
          background: var(--secondary); border-radius: 6px;
          border: 1px solid var(--light);
          font-size: 0.82rem; color: var(--shadow);
        }
        .aw-archive-teaser strong { color: var(--primary); }
        .aw-archive-divider {
          border: none; border-top: 1px solid var(--light);
          margin: 20px 0;
        }

        /* ── Research notes ── */
        .aw-notes { font-size:0.88rem; color:var(--shadow); opacity:0.65;
          line-height:1.6; font-style:italic; }

        /* ── Citations panel ── */
        .cite-panel { background:white; border:1px solid var(--light); border-radius:0.35rem;
          overflow:hidden; margin-top:40px; }
        .cite-header { padding:18px 20px 14px; border-bottom:1px solid var(--light); }
        .cite-title { font-size:0.72rem; font-weight:700; text-transform:uppercase;
          letter-spacing:0.08em; color:var(--primary); opacity:0.6; margin-bottom:4px; }
        .cite-note { font-size:0.8rem; color:var(--shadow); opacity:0.5; }
        .cite-tabs { display:flex; border-bottom:1px solid var(--light); }
        .cite-tab { padding:9px 18px; background:none; border:none; border-bottom:2px solid transparent;
          font-size:0.82rem; font-weight:500; color:var(--shadow); opacity:0.5;
          cursor:pointer; transition:all 0.15s; font-family:inherit; margin-bottom:-1px; }
        .cite-tab:hover { opacity:0.8; }
        .cite-tab.active { color:var(--primary); opacity:1; border-bottom-color:var(--primary); }
        .cite-body { padding:16px 20px; display:flex; gap:12px; align-items:flex-start; }
        .cite-text { flex:1; font-size:0.85rem; line-height:1.7; color:var(--shadow);
          font-family:Georgia, serif; }
        .cite-copy { flex-shrink:0; padding:5px 12px; border:1px solid var(--light);
          border-radius:0.25rem; background:white; color:var(--shadow); font-size:0.78rem;
          cursor:pointer; transition:all 0.15s; font-family:inherit; white-space:nowrap; }
        .cite-copy:hover { background:var(--primary); color:white; border-color:var(--primary); }
        .cite-footer { padding:10px 20px 14px; font-size:0.75rem; color:var(--shadow);
          opacity:0.4; border-top:1px solid var(--light); font-style:italic; }

        /* ── States ── */
        .aw-state { text-align:center; padding:40px 20px; color:var(--shadow); opacity:0.55; }
        .aw-error { background:#fff0f0; border-radius:0.35rem; opacity:1;
          color:#a00; padding:20px; text-align:left; }
        .aw-loading-bar { width:160px; height:3px; background:var(--light);
          border-radius:2px; overflow:hidden; margin:0 auto 12px; }
        .aw-loading-fill { height:100%; background:var(--primary);
          animation:awLoad 1.2s ease-in-out infinite; }
        @keyframes awLoad { 0%{width:0;margin-left:0} 50%{width:60%;margin-left:20%} 100%{width:0;margin-left:100%} }

        /* ════════════════════════════════════════
           PRINT STYLES
           ════════════════════════════════════════ */
        @media print {
          /* ── Suppress browser-generated headers and footers ── */
          @page {
            margin: 15mm 15mm 18mm 15mm;
          }
          @page :first {
            margin-top: 10mm;
          }

          /* Hide everything except the fact sheet content */
          header, nav, footer, .aw-print-btn, .cite-copy,
          .cite-tabs, section.hero { display:none !important; }

          body { background:white; color:black; font-size:10pt; }
          .panel.light { padding:0 !important; }
          article { max-width:100% !important; padding:0 !important; }

          /* Print header — Foundation branding */
          .aw-print-header { display:block !important; }

          /* Description runs full width */
          .aw-description { max-width:100%; margin-bottom:24pt; }
          .aw-description-text { font-size:10pt; line-height:1.6; }

          /* Two-column layout becomes single column */
          .aw-layout { grid-template-columns:1fr !important; gap:0 !important; }

          /* Image — constrained for print */
          .aw-image-frame { position:static !important; max-width:340pt; margin:0 auto 24pt; }
          .aw-img-shield { display:none !important; }

          /* Sections */
          .aw-section { break-inside:avoid; margin-bottom:16pt; }
          .aw-section-label { font-size:7pt; border-bottom:0.5pt solid #ccc; padding-bottom:4pt; margin-bottom:8pt; }
          .aw-dl { gap:3pt 16pt; font-size:9pt; }

          /* Hide screen-only citation panel — print version is in cite-body-all below */
          .cite-panel { display:none !important; }

          /* Citations — keep together, never split across pages */
          .cite-body-all .cite-panel-print { border:0.5pt solid #ccc; break-inside:avoid; page-break-inside:avoid; margin-top:24pt; }
          .cite-header { padding:10pt 12pt 8pt; }
          .cite-body { padding:10pt 12pt; }
          .cite-text { font-size:8.5pt; line-height:1.5; }
          .cite-footer { font-size:7pt; }

          /* Show all citation formats stacked in print */
          .cite-tabs { display:none !important; }
          .cite-body-all { display:block !important; }
          .cite-format-block { break-inside:avoid; margin-bottom:10pt; padding-bottom:10pt; border-bottom:0.5pt solid #eee; }
          .cite-format-label { font-size:7pt; font-weight:bold; text-transform:uppercase;
            letter-spacing:0.05em; color:#666; margin-bottom:4pt; }
          .cite-format-text { font-size:8.5pt; line-height:1.5; font-family:Georgia,serif; }
        }

        /* Hide print-only elements on screen */
        .aw-print-header { display:none; }
        .cite-body-all { display:none; }
      `}</style>

      {/* ── Hero ── */}
      <section className="hero">
        <article>
          <div className="hero-content">
            <div className="preheading">
              <Link to="/works/browse" className="aw-breadcrumb">Works</Link>
              {" · "}
              {loading ? "Loading…" : w ? cleanYear(w.dateText) || "Undated" : "Not found"}
            </div>
            <h1>{loading ? "Loading…" : w ? w.title || "Untitled" : "Artwork not found"}</h1>
            {w?.medium && <p>{w.medium}</p>}
            <div className="btn-duo">
              <Link className="cta-primary dull" to="/works/browse">← Browse works</Link>
            </div>
            {w && (
              <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <button className="aw-print-btn" onClick={() => {
                  const prev = document.title;
                  const year = cleanYear(w.dateText);
                  document.title = `John Luke - ${w.title || "Untitled"}${year ? ` (${year})` : ""} - Fact Sheet - John Luke Foundation ${new Date().getFullYear()}`;
                  window.print();
                  document.title = prev;
                }}>
                  ⬇ Download / Print fact sheet
                </button>
                <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.45)", lineHeight: "1.4" }}>
                  In the print dialog, open <em>More settings</em> and uncheck <em>Headers and footers</em> for a clean PDF.
                </div>
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="panel light">
        <article>
          <div className="panel-content" style={{ width: "100%" }}>

            {/* ── Print-only header ── */}
            <div className="aw-print-header">
              <div style={{ borderBottom: "1pt solid #ccc", paddingBottom: "12pt", marginBottom: "20pt",
                display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                  <div style={{ fontSize: "7pt", textTransform: "uppercase", letterSpacing: "0.08em",
                    color: "#888", marginBottom: "4pt" }}>John Luke Foundation</div>
                  <div style={{ fontSize: "16pt", fontWeight: "600" }}>{w?.title || "Untitled"}</div>
                  {w?.dateText && <div style={{ fontSize: "10pt", color: "#444", marginTop: "2pt" }}>{cleanYear(w?.dateText)}</div>}
                </div>
                <div style={{ fontSize: "7pt", color: "#aaa", textAlign: "right" }}>
                  johnluke.art<br />
                  Accessed: {today()}
                </div>
              </div>
            </div>

            {loading && (
              <div className="aw-state">
                <div className="aw-loading-bar"><div className="aw-loading-fill" /></div>
                <p>Loading artwork…</p>
              </div>
            )}
            {error && !loading && (
              <div className="aw-state aw-error">
                <p><strong>Could not load this artwork.</strong> {error}</p>
              </div>
            )}

            {!loading && !error && w && (
              <>
                {/* ── Description — full width above columns ── */}
                {w.description && (
                  <div className="aw-description">
                    <div className="aw-description-label">About this work</div>
                    <div className="aw-description-text">
                      {w.description.split(/\n\n+/).map((para, i) => (
                        <p key={i}>{para.trim()}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Two-column: image + details ── */}
                <div className="aw-layout">

                  {/* Image */}
                  <div className="aw-image-col">
                    <div className="aw-image-frame">
                      {image && !imgErr ? (
                        <div className="aw-img-wrap">
                          <img src={image} alt={w.title}
                            onError={() => setImgErr(true)}
                            onContextMenu={e => e.preventDefault()}
                            onDragStart={e => e.preventDefault()} />
                          <div className="aw-img-shield" />
                        </div>
                      ) : (
                        <div className="aw-img-placeholder">
                          <span>{id || "◎"}</span>
                          <p>Image not yet available</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="aw-detail-col">

                    <div className="aw-section">
                      <div className="aw-section-label">Artwork details</div>
                      <dl className="aw-dl">
                        {id && <><dt>Catalogue no.</dt><dd className="aw-id-val">{id}</dd></>}
                        {w.dateText   && <><dt>Date</dt><dd>{cleanYear(w.dateText)}</dd></>}
                        {w.medium     && <><dt>Medium</dt><dd>{w.medium}</dd></>}
                        {w.techniques?.filter(Boolean).length > 0 && (
                          <><dt>Technique</dt><dd>{w.techniques.filter(Boolean).join(", ")}</dd></>
                        )}
                        {w.dimensions && <><dt>Dimensions</dt><dd>{w.dimensions}</dd></>}
                        {w.location   && <><dt>Collection</dt><dd>{w.location}</dd></>}
                        {w.periods?.filter(Boolean).length > 0 && (
                          <><dt>Period</dt><dd>{w.periods.filter(Boolean).join(", ")}</dd></>
                        )}
                      </dl>

                      {/* Timeline visibility toggle */}
                      {sessionReady && (
                        <div style={{
                          marginTop: 14, paddingTop: 14,
                          borderTop: "1px solid var(--light)",
                          display: "flex", alignItems: "center", gap: 10,
                        }}>
                          <button
                            onClick={toggleTimelineVisible}
                            disabled={isSaving}
                            title={tlVisible ? "Hide from your timeline view (only affects your session)" : "Show on your timeline view"}
                            style={{
                              display: "flex", alignItems: "center", gap: 7,
                              background: "none", border: "1px solid var(--light)",
                              borderRadius: 4, padding: "4px 10px",
                              cursor: isSaving ? "wait" : "pointer",
                              fontSize: "0.72rem", letterSpacing: "0.04em",
                              color: tlVisible ? "var(--text-muted)" : "rgba(180,100,100,0.9)",
                              transition: "all 0.2s",
                            }}
                          >
                            <span style={{ fontSize: "0.9rem" }}>
                              {tlVisible ? "◉" : "◎"}
                            </span>
                            {isSaving ? "Saving…" : tlVisible ? "On your timeline" : "Hidden from your timeline"}
                          </button>
                          {tlMsg && (
                            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)",
                              fontStyle: "italic" }}>
                              {tlMsg}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {exhibitions.length > 0 && (
                      <div className="aw-section">
                        <div className="aw-section-label">Exhibition history</div>
                        <div className="aw-ex-list">
                          {exhibitions.map((ex, i) => (
                            <div key={i} className="aw-ex-item">
                              <div className="aw-ex-year">{ex.yearText || "—"}</div>
                              <div>
                                <Link to={`/exhibitions/historical/${ex.exhibitionId}`} className="aw-ex-link">
                                  {ex.title}
                                </Link>
                                <div className="aw-ex-meta">
                                  {ex.venue && <span>{ex.venue}</span>}
                                  {ex.catalogueNumber && <span>Cat No.: {ex.catalogueNumber}</span>}
                                  {ex.salePrice && (
                                    <span>
                                      {ex.sold === true ? "Sold · " : ex.sold === false ? "Unsold · " : ""}
                                      {ex.salePrice}
                                    </span>
                                  )}
                                </div>
                                {ex.catalogueNotes && (
                                  <div className="aw-ex-catnotes">{ex.catalogueNotes}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {ownership.length > 0 && (
                      <div className="aw-section">
                        <div className="aw-section-label">Provenance</div>
                        <div className="aw-own-list">
                          {ownership.map((op, i) => (
                            <div key={i} className="aw-own-item">
                              <div className="aw-own-years">
                                {op.fromYear || "?"}
                                {" – "}
                                {op.toYear ? op.toYear : <span className="aw-own-present">present</span>}
                              </div>
                              <div>
                                <div className="aw-own-name">{op.ownerName}</div>
                                <div className="aw-own-meta">
                                  {op.ownerType     && <span>{op.ownerType}</span>}
                                  {op.ownerLocation && <span>{op.ownerLocation}</span>}
                                  {op.method        && <span>{op.method}</span>}
                                  {op.certainty     && (
                                    <span className={`cert-badge ${CERTAINTY_CLASS[op.certainty] || ""}`}>
                                      {op.certainty}
                                    </span>
                                  )}
                                </div>
                                {op.source && <div className="aw-own-source">Source: {op.source}</div>}
                                {op.notes  && <div className="aw-own-notes">⚠ {op.notes}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {w.notes && (
                      <div className="aw-section">
                        <div className="aw-section-label">Research notes</div>
                        <div className="aw-notes">{w.notes}</div>
                      </div>
                    )}

                  </div>
                </div>

                {/* ── Related works — studies and primary work ── */}
                {((w.studies && w.studies.length > 0) || w.primaryWork) && (
                  <div className="aw-related">
                    <div className="aw-related-label">Related works</div>
                    <div className="aw-related-grid">
                      {w.primaryWork && (
                        <Link to={`/works/${w.primaryWork.artworkId}`} className="aw-related-card">
                          {w.primaryWork.thumbnailUrl || w.primaryWork.imageUrl
                            ? <img className="aw-related-thumb"
                                src={w.primaryWork.thumbnailUrl || w.primaryWork.imageUrl}
                                alt={w.primaryWork.title} />
                            : <div className="aw-related-thumb-ph">◎</div>
                          }
                          <div className="aw-related-info">
                            <div className="aw-related-rel">Primary work</div>
                            <div className="aw-related-title">{w.primaryWork.title}</div>
                            <div className="aw-related-meta">
                              {w.primaryWork.dateText && <span>{w.primaryWork.dateText}</span>}
                              {w.primaryWork.medium && <span> · {w.primaryWork.medium}</span>}
                            </div>
                          </div>
                        </Link>
                      )}
                      {w.studies && w.studies.map((study, i) => (
                        <Link key={i} to={`/works/${study.artworkId}`} className="aw-related-card">
                          {study.thumbnailUrl || study.imageUrl
                            ? <img className="aw-related-thumb"
                                src={study.thumbnailUrl || study.imageUrl}
                                alt={study.title} />
                            : <div className="aw-related-thumb-ph">◎</div>
                          }
                          <div className="aw-related-info">
                            <div className="aw-related-rel">Study</div>
                            <div className="aw-related-title">{study.title}</div>
                            <div className="aw-related-meta">
                              {study.dateText && <span>{study.dateText}</span>}
                              {study.medium && <span> · {study.medium}</span>}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── From the archive ── */}
                {hasArchiveContent && (
                  <div className="aw-archive">
                    <div className="aw-archive-label">From the archive</div>

                    {/* Public excerpts — visible to all */}
                    {publicExcerpts.map((ex, i) => (
                      <div key={i} className="aw-excerpt">
                        <div className="aw-excerpt-text">
                          &ldquo;{ex.text}&rdquo;
                        </div>
                        {ex.context && (
                          <div style={{ fontSize: "0.8rem", color: "var(--shadow)", opacity: 0.7,
                            fontStyle: "italic", marginBottom: 8 }}>
                            {ex.context}
                          </div>
                        )}
                        <div className="aw-excerpt-meta">
                          <span className="aw-excerpt-source">
                            {ex.docAuthor}
                            {ex.docRecipient ? ` to ${ex.docRecipient}` : ""}
                            {ex.docDateText ? `, ${ex.docDateText}` : ""}
                          </span>
                          {ex.docArchiveRef && <span>{ex.docArchiveRef}</span>}
                          {ex.confidence !== "certain" && (
                            <span className="aw-excerpt-confidence">{ex.confidence}</span>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Researcher excerpts */}
                    {isResearcher ? (
                      <>
                        {researchExcerpts.length > 0 && publicExcerpts.length > 0 && (
                          <hr className="aw-archive-divider" />
                        )}
                        {researchExcerpts.map((ex, i) => (
                          <div key={i} className="aw-excerpt" style={{
                            borderLeftColor: "var(--accent)",
                          }}>
                            <div className="aw-excerpt-text">
                              &ldquo;{ex.text}&rdquo;
                            </div>
                            {ex.context && (
                              <div style={{ fontSize: "0.8rem", color: "var(--shadow)", opacity: 0.7,
                                fontStyle: "italic", marginBottom: 8 }}>
                                {ex.context}
                              </div>
                            )}
                            <div className="aw-excerpt-meta">
                              <span className="aw-excerpt-source">
                                {ex.docAuthor}
                                {ex.docRecipient ? ` to ${ex.docRecipient}` : ""}
                                {ex.docDateText ? `, ${ex.docDateText}` : ""}
                              </span>
                              {ex.docArchiveRef && <span>{ex.docArchiveRef}</span>}
                              {ex.confidence !== "certain" && (
                                <span className="aw-excerpt-confidence">{ex.confidence}</span>
                              )}
                              {ex.documentId && (
                                <a href={`/archive/documents/${ex.documentId}`}
                                  className="aw-excerpt-doc-link">
                                  View full letter →
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </>
                    ) : researchExcerpts.length > 0 && (
                      <div className="aw-archive-teaser">
                        <strong>{researchExcerpts.length} further reference{researchExcerpts.length > 1 ? "s" : ""}</strong>
                        {" "}including full letter transcriptions with inline artwork references
                        are available to <a href="/access" style={{ color: "var(--primary)" }}>research account holders</a>.
                      </div>
                    )}
                  </div>
                )}

                {/* ── Citations — full width below columns ── */}
                <CitationsPanel artwork={w} />

                {/* ── Print-only: all citation formats stacked ── */}
                <div className="cite-body-all">
                  {(() => {
                    const url = typeof window !== "undefined" ? window.location.href : "";
                    const c = buildCitations(w, url);
                    return (
                      <div className="cite-panel" style={{ marginTop: "24pt" }}>
                        <div className="cite-header">
                          <div className="cite-title">Citation</div>
                        </div>
                        {[
                          { id: "chicago", label: "Chicago (Notes & Bibliography)" },
                          { id: "mla",     label: "MLA 9th Edition" },
                          { id: "plainUrl", label: "URL Reference" },
                        ].map(f => (
                          <div key={f.id} className="cite-format-block" style={{ padding: "10pt 12pt" }}>
                            <div className="cite-format-label">{f.label}</div>
                            <div className="cite-format-text">{c[f.id]}</div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

              </>
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
