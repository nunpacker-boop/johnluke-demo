import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";

// ── Helpers ───────────────────────────────────────────────────────────────────
function cleanYear(v) {
  return v ? String(v).replace(/\.0$/, "") : null;
}

const RELIABILITY = {
  primary:   { label: "Primary source — major scholarly catalogue", cls: "rel-primary" },
  major:     { label: "Major catalogue",                            cls: "rel-major" },
  standard:  { label: "Documented exhibition",                      cls: "rel-standard" },
  minor:     { label: "Minor catalogue",                            cls: "rel-minor" },
  uncertain: { label: "Source uncertain — no catalogue confirmed",  cls: "rel-uncertain" },
};

function ReliabilityBadge({ value }) {
  if (!value) return null;
  const r = RELIABILITY[value] || { label: value, cls: "rel-standard" };
  return <span className={`fs-reliability ${r.cls}`}>{r.label}</span>;
}

// ── SafeNotes — plain text with bare URLs converted to links ──────────────────
function SafeNotes({ text, className }) {
  if (!text) return null;
  const parts = [];
  const re = /https?:\/\/[^\s,)]+/g;
  let last = 0, match;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) parts.push({ type: "text", value: text.slice(last, match.index) });
    parts.push({ type: "link", href: match[0].replace(/[.,;:!?'"]+$/, "") });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ type: "text", value: text.slice(last) });

  return (
    <div className={className}>
      {parts.map((p, i) =>
        p.type === "link"
          ? <a key={i} href={p.href} target="_blank" rel="noreferrer noopener" className="fs-notes-link">{p.href}</a>
          : p.value.split("\n").map((line, j, arr) =>
              <span key={`${i}-${j}`}>{line}{j < arr.length - 1 && <br />}</span>
            )
      )}
    </div>
  );
}

// ── Artwork card in virtual catalogue ─────────────────────────────────────────
function CatalogueCard({ work }) {
  const [imgErr, setImgErr] = useState(false);
  const thumb = work.thumbnailUrl || work.imageUrl;
  const id = work.artworkId ? work.artworkId.replace("artwork-", "").toUpperCase() : null;

  return (
    <Link
      to={work.artworkId ? `/works/${work.artworkId}` : "#"}
      className="cat-card">
      <div className="cat-card-image">
        {thumb && !imgErr ? (
          <div className="cat-img-wrap">
            <img src={thumb} alt={work.title}
              onError={() => setImgErr(true)}
              onContextMenu={e => e.preventDefault()}
              onDragStart={e => e.preventDefault()}
              loading="lazy" />
            <div className="cat-img-shield" />
          </div>
        ) : (
          <div className="cat-placeholder"><span>{id || "◎"}</span></div>
        )}
      </div>
      <div className="cat-card-body">
        {work.catalogueNumber && (
          <div className="cat-catno">Cat No.: {work.catalogueNumber}</div>
        )}
        <div className="cat-title">{work.title || "Untitled"}</div>
        {work.dateText && <div className="cat-date">{cleanYear(work.dateText)}</div>}
        {work.medium   && <div className="cat-medium">{work.medium}</div>}
        {(work.salePrice || work.sold != null) && (
          <div className="cat-price">
            {work.sold === true ? "Sold" : work.sold === false ? "Unsold" : ""}
            {work.salePrice ? (work.sold != null ? " · " : "") + work.salePrice : ""}
          </div>
        )}
        {work.catalogueNotes && <div className="cat-catnotes">{work.catalogueNotes}</div>}
        <div className="cat-more">View artwork →</div>
      </div>
    </Link>
  );
}

// ── Main exhibition fact sheet page ──────────────────────────────────────────
export default function ExhibitionFactSheet() {
  const { id } = useParams();

  const [exhibition, setExhibition] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/exhibitions?id=${encodeURIComponent(id)}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        if (!d.exhibition) throw new Error("Exhibition not found");
        setExhibition(d.exhibition);
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [id]);

  const ex = exhibition;
  const artworks = (ex?.artworks || [])
    .slice()
    .sort((a, b) => (parseInt(a.catalogueNumber) || 9999) - (parseInt(b.catalogueNumber) || 9999));

  return (
    <main>
      <section className="hero">
        <article>
          <div className="hero-content">
            <div className="preheading">
              <Link to="/exhibitions/historical" className="fs-breadcrumb">Exhibitions</Link>
              {" · "}
              {loading ? "Loading…" : ex ? ex.yearText : "Not found"}
            </div>
            <h1>{loading ? "Loading…" : ex ? ex.title : "Exhibition not found"}</h1>
            {ex && (
              <p>
                {[ex.exhibitionType, ex.venue, ex.organiser].filter(Boolean).join(" · ")}
                {(ex.openingDate || ex.closingDate) && (
                  <> &nbsp;·&nbsp; {[ex.openingDate, ex.closingDate].filter(Boolean).join(" – ")}</>
                )}
              </p>
            )}
            <div className="btn-duo">
              <Link className="cta-primary dull" to="/exhibitions/historical">← All exhibitions</Link>
            </div>
            {ex && (
              <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <button className="ex-print-btn" onClick={() => {
                  const prev = document.title;
                  document.title = `John Luke - ${ex.title || "Exhibition"}${ex.yearText ? ` (${ex.yearText})` : ""} - Virtual Catalogue - John Luke Foundation ${new Date().getFullYear()}`;
                  window.print();
                  document.title = prev;
                }}>
                  ⬇ Download / Print virtual catalogue
                </button>
                {ex.catalogueUrl && (
                  <a href={ex.catalogueUrl} target="_blank" rel="noreferrer noopener"
                    className="ex-print-btn" style={{ textDecoration: "none" }}>
                    ↗ View original exhibition catalogue
                  </a>
                )}
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
            <div className="ex-print-header">
              <div className="ex-print-header-inner">
                <div>
                  <div className="ex-print-foundation">John Luke Foundation</div>
                  <div className="ex-print-title">{ex?.title || ""}</div>
                  {ex?.yearText && <div className="ex-print-year">{ex.yearText}</div>}
                </div>
                <div className="ex-print-meta-right">
                  johnluke.art<br />
                  Accessed: {typeof window !== "undefined"
                    ? new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
                    : ""}
                </div>
              </div>
            </div>

            {loading && (
              <div className="ex-state">
                <div className="ex-loading-bar"><div className="ex-loading-fill" /></div>
                <p>Loading exhibition…</p>
              </div>
            )}
            {error && !loading && (
              <div className="ex-state ex-error">
                <p><strong>Could not load this exhibition.</strong> {error}</p>
              </div>
            )}

            {!loading && !error && ex && (
              <>
                {/* ── Fact sheet metadata ── */}
                <div className="fs-meta-card">
                  <div className="fs-meta-grid">
                    {ex.yearText && (
                      <div className="fs-meta-item">
                        <div className="fs-meta-label">Year</div>
                        <div className="fs-meta-value">{ex.yearText}</div>
                      </div>
                    )}
                    {ex.exhibitionType && (
                      <div className="fs-meta-item">
                        <div className="fs-meta-label">Type</div>
                        <div className="fs-meta-value">{ex.exhibitionType}</div>
                      </div>
                    )}
                    {ex.venue && (
                      <div className="fs-meta-item">
                        <div className="fs-meta-label">Venue</div>
                        <div className="fs-meta-value">{ex.venue}</div>
                      </div>
                    )}
                    {ex.organiser && (
                      <div className="fs-meta-item">
                        <div className="fs-meta-label">Organiser</div>
                        <div className="fs-meta-value">{ex.organiser}</div>
                      </div>
                    )}
                    {(ex.openingDate || ex.closingDate) && (
                      <div className="fs-meta-item">
                        <div className="fs-meta-label">Dates</div>
                        <div className="fs-meta-value">
                          {[ex.openingDate, ex.closingDate].filter(Boolean).join(" – ")}
                        </div>
                      </div>
                    )}
                    {ex.catalogueRef && (
                      <div className="fs-meta-item">
                        <div className="fs-meta-label">Catalogue</div>
                        <div className="fs-meta-value">
                          {ex.catalogueUrl
                            ? <a href={ex.catalogueUrl} target="_blank" rel="noreferrer" className="fs-cat-link">{ex.catalogueRef} ↗</a>
                            : ex.catalogueRef}
                        </div>
                      </div>
                    )}
                    {ex.reliability && (
                      <div className="fs-meta-item fs-meta-full">
                        <div className="fs-meta-label">Source quality</div>
                        <div className="fs-meta-value"><ReliabilityBadge value={ex.reliability} /></div>
                      </div>
                    )}
                  </div>
                  {ex.notes && <SafeNotes text={ex.notes} className="fs-notes" />}
                </div>

                {/* ── Virtual catalogue ── */}
                <div className="fs-catalogue-header">
                  <div className="fs-catalogue-title">
                    Virtual Catalogue
                    {artworks.length > 0 && (
                      <span className="fs-catalogue-count">
                        {artworks.length} work{artworks.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  {artworks.length > 0 && (
                    <p className="fs-catalogue-sub">
                      Click any work to view its fact sheet.
                      {artworks.some(w => !w.catalogueNumber) && (
                        <> Works without a catalogue number are listed at the end.</>
                      )}
                    </p>
                  )}
                </div>

                {artworks.length === 0 && (
                  <div className="fs-empty">
                    No artworks have been linked to this exhibition yet.
                  </div>
                )}

                {artworks.length > 0 && (
                  <div className="cat-grid">
                    {artworks.map((w, i) => (
                      <CatalogueCard key={w.artworkId || i} work={w} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </article>
      </section>

      <style>{`
        .fs-breadcrumb { color:rgba(255,255,255,0.6); text-decoration:none; }
        .fs-breadcrumb:hover { color:white; }

        .fs-meta-card { background:white; border:1px solid var(--light); border-radius:0.35rem; padding:24px; margin-bottom:32px; }
        .fs-meta-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(180px, 1fr)); gap:16px 24px; margin-bottom:0; }
        .fs-meta-item { display:flex; flex-direction:column; gap:4px; }
        .fs-meta-full { grid-column:1/-1; }
        .fs-meta-label { font-size:0.72rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:var(--shadow); opacity:0.4; }
        .fs-meta-value { font-size:0.92rem; color:var(--shadow); line-height:1.4; }
        .fs-cat-link { color:var(--primary); text-decoration:underline; text-underline-offset:2px; }

        .fs-reliability { display:inline-block; padding:3px 10px; border-radius:2rem; font-size:0.78rem; font-weight:600; }
        .rel-primary   { background:#e4f4e4; color:#2d6a4f; }
        .rel-major     { background:#e0ecf7; color:#2a5f8a; }
        .rel-standard  { background:#fdf3e0; color:#ae6818; }
        .rel-minor     { background:#f0f0f0; color:#6a6a6a; }
        .rel-uncertain { background:#fde8e8; color:#9b2226; }

        .fs-notes { margin-top:16px; padding-top:16px; border-top:1px solid var(--light); font-size:0.88rem; color:var(--shadow); opacity:0.7; font-style:italic; line-height:1.6; }
        .fs-notes-link { color:var(--primary); text-decoration:underline; text-underline-offset:2px; font-style:normal; font-weight:500; }
        .fs-notes-link:hover { opacity:0.7; }

        .fs-catalogue-header { margin-bottom:16px; }
        .fs-catalogue-title { font-family:var(--ff-hx); font-size:1.2rem; font-weight:600; color:var(--shadow); display:flex; align-items:baseline; gap:10px; }
        .fs-catalogue-count { font-size:0.82rem; font-weight:400; color:var(--shadow); opacity:0.45; font-family:var(--ff-body); }
        .fs-catalogue-sub { font-size:0.85rem; color:var(--shadow); opacity:0.5; margin-top:4px; }
        .fs-empty { font-size:0.9rem; color:var(--shadow); opacity:0.4; font-style:italic; padding:24px 0; }

        .cat-grid { display:grid; grid-template-columns:repeat(5, minmax(0,1fr)); gap:16px; }
        @media (max-width:1100px) { .cat-grid { grid-template-columns:repeat(4, minmax(0,1fr)); } }
        @media (max-width:800px)  { .cat-grid { grid-template-columns:repeat(3, minmax(0,1fr)); } }
        @media (max-width:540px)  { .cat-grid { grid-template-columns:repeat(2, minmax(0,1fr)); } }

        .cat-card { display:block; text-decoration:none; background:white; border:1px solid var(--light); border-radius:0.3rem; overflow:hidden; transition:box-shadow 0.15s, border-color 0.15s; }
        .cat-card:hover { box-shadow:0 4px 16px rgba(4,36,54,0.1); border-color:#aab; }
        .cat-card:hover .cat-more { opacity:1; }

        .cat-card-image { aspect-ratio:4/3; background:#f0ede8; overflow:hidden; display:flex; align-items:center; justify-content:center; }
        .cat-img-wrap { position:relative; width:100%; height:100%; }
        .cat-img-wrap img { width:100%; height:100%; object-fit:cover; display:block; pointer-events:none; user-select:none; -webkit-user-drag:none; transition:transform 0.3s; }
        .cat-card:hover .cat-img-wrap img { transform:scale(1.03); }
        .cat-img-shield { position:absolute; inset:0; z-index:2; }
        .cat-placeholder { width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:#c8beb4; font-size:0.7rem; font-family:monospace; }

        .cat-card-body { padding:10px 12px; display:flex; flex-direction:column; gap:2px; }
        .cat-catno    { font-size:0.68rem; font-weight:700; color:var(--primary); opacity:0.6; letter-spacing:0.04em; }
        .cat-title    { font-family:var(--ff-hx); font-size:0.85rem; font-weight:500; color:var(--shadow); line-height:1.3; }
        .cat-date     { font-size:0.72rem; color:var(--shadow); opacity:0.55; }
        .cat-medium   { font-size:0.7rem; color:var(--shadow); opacity:0.45; font-style:italic; }
        .cat-price    { font-size:0.7rem; color:var(--shadow); opacity:0.6; font-weight:600; }
        .cat-catnotes { font-size:0.68rem; color:var(--shadow); opacity:0.45; line-height:1.4; margin-top:2px; }
        .cat-more     { font-size:0.72rem; color:var(--primary); font-weight:600; margin-top:6px; opacity:0; transition:opacity 0.15s; }

        .ex-state { text-align:center; padding:40px 20px; color:var(--shadow); opacity:0.55; }
        .ex-error { background:#fff0f0; border-radius:0.35rem; opacity:1; color:#a00; padding:20px; text-align:left; }
        .ex-loading-bar { width:160px; height:3px; background:var(--light); border-radius:2px; overflow:hidden; margin:0 auto 12px; }
        .ex-loading-fill { height:100%; background:var(--primary); animation:exLoad 1.2s ease-in-out infinite; }
        @keyframes exLoad { 0%{width:0;margin-left:0} 50%{width:60%;margin-left:20%} 100%{width:0;margin-left:100%} }

        /* ── Print button ── */
        .ex-print-btn { display:inline-flex; align-items:center; gap:6px; padding:7px 16px;
          border:1px solid rgba(255,255,255,0.3); border-radius:0.25rem;
          background:transparent; color:rgba(255,255,255,0.8); font-size:0.82rem;
          cursor:pointer; transition:all 0.15s; font-family:inherit; }
        .ex-print-btn:hover { background:rgba(255,255,255,0.1); color:white; border-color:rgba(255,255,255,0.6); }

        /* ── Print header (screen: hidden) ── */
        .ex-print-header { display:none; }

        /* ════════════════════════════════════════
           PRINT STYLES
           ════════════════════════════════════════ */
        @media print {
          @page { margin:15mm 15mm 18mm 15mm; }
          @page :first { margin-top:10mm; }

          header, nav, footer, .ex-print-btn, section.hero,
          .ex-filter-bar, .fs-notes-link { display:none !important; }

          body { background:white; color:black; font-size:10pt; }
          .panel.light { padding:0 !important; }
          article { max-width:100% !important; padding:0 !important; }

          /* Show print header */
          .ex-print-header { display:block !important; margin-bottom:20pt; }
          .ex-print-header-inner { display:flex; justify-content:space-between; align-items:flex-end;
            border-bottom:0.5pt solid #ccc; padding-bottom:10pt; }
          .ex-print-foundation { font-size:7pt; text-transform:uppercase; letter-spacing:0.08em; color:#888; margin-bottom:3pt; }
          .ex-print-title { font-size:16pt; font-weight:600; color:#042436; line-height:1.2; }
          .ex-print-year { font-size:10pt; color:#444; margin-top:2pt; }
          .ex-print-meta-right { font-size:7pt; color:#aaa; text-align:right; line-height:1.6; }

          /* Fact sheet metadata card */
          .fs-meta-card { border:0.5pt solid #ccc; padding:12pt; margin-bottom:16pt; border-radius:0; }
          .fs-meta-grid { grid-template-columns:repeat(4, 1fr); gap:10pt 16pt; }
          .fs-meta-label { font-size:6.5pt; }
          .fs-meta-value { font-size:9pt; }

          /* Notes */
          .fs-notes { font-size:8pt; margin-top:10pt; padding-top:10pt; }

          /* Catalogue heading */
          .fs-catalogue-header { margin-bottom:10pt; break-after:avoid; }
          .fs-catalogue-title { font-size:11pt; }
          .fs-catalogue-sub { font-size:8pt; }

          /* Catalogue grid — 4 columns for print */
          .cat-grid { grid-template-columns:repeat(4, minmax(0,1fr)) !important; gap:10pt; }

          /* Cards */
          .cat-card { break-inside:avoid; border:0.5pt solid #ccc; border-radius:0; box-shadow:none !important; }
          .cat-card:hover { box-shadow:none !important; }
          .cat-img-shield { display:none !important; }
          .cat-img-wrap img { pointer-events:auto; }
          .cat-card-body { padding:5pt 6pt; }
          .cat-catno  { font-size:6pt; }
          .cat-title  { font-size:7.5pt; }
          .cat-date   { font-size:6.5pt; }
          .cat-medium { font-size:6pt; }
          .cat-price  { font-size:6pt; }
          .cat-catnotes { font-size:6pt; }
          .cat-more   { display:none !important; }

          /* Reliability badges */
          .fs-reliability { border:0.5pt solid #ccc; background:none !important; color:#333 !important; font-size:6.5pt; }
        }
      `}</style>
    </main>
  );
}
