import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// ── Reliability badge ─────────────────────────────────────────────────────────
const RELIABILITY = {
  primary:   { label: "Primary source",   cls: "rel-primary" },
  major:     { label: "Major catalogue",  cls: "rel-major" },
  standard:  { label: "Documented",       cls: "rel-standard" },
  minor:     { label: "Minor catalogue",  cls: "rel-minor" },
  uncertain: { label: "Source uncertain", cls: "rel-uncertain" },
};

function ReliabilityBadge({ value }) {
  if (!value) return null;
  const r = RELIABILITY[value] || { label: value, cls: "rel-standard" };
  return <span className={`ex-reliability ${r.cls}`}>{r.label}</span>;
}

// ── Artwork card inside expanded exhibition ───────────────────────────────────
function ExhibitedWork({ work }) {
  const [imgErr, setImgErr] = useState(false);
  const thumb = work.thumbnailUrl || work.imageUrl;
  const id = work.artworkId
    ? work.artworkId.replace("artwork-", "").toUpperCase()
    : null;

  return (
    <div className="ex-work">
      <div className="ex-work-image">
        {thumb && !imgErr ? (
          <div className="ex-work-img-wrap">
            <img src={thumb} alt={work.title}
              onError={() => setImgErr(true)}
              onContextMenu={e => e.preventDefault()}
              onDragStart={e => e.preventDefault()}
              loading="lazy" />
            <div className="ex-work-shield" />
          </div>
        ) : (
          <div className="ex-work-placeholder"><span>{id || "◎"}</span></div>
        )}
      </div>
      <div className="ex-work-info">
        {work.catalogueNumber && (
          <div className="ex-work-catno">Cat. {work.catalogueNumber}</div>
        )}
        <div className="ex-work-title">{work.title || "Untitled"}</div>
        {work.dateText && <div className="ex-work-date">{work.dateText}</div>}
        {work.medium   && <div className="ex-work-medium">{work.medium}</div>}
        {work.salePrice && (
          <div className="ex-work-price">
            {work.sold === true ? "Sold · " : work.sold === false ? "Unsold · " : ""}
            {work.salePrice}
          </div>
        )}
        {work.catalogueNotes && (
          <div className="ex-work-catnotes">{work.catalogueNotes}</div>
        )}
      </div>
    </div>
  );
}

// ── Single exhibition row ─────────────────────────────────────────────────────
function ExhibitionRow({ ex, isOpen, onToggle }) {
  const [detail,  setDetail]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!isOpen || detail || !ex.exhibitionId) return;
    setLoading(true);
    fetch(`/api/exhibitions?id=${encodeURIComponent(ex.exhibitionId)}`)
      .then(r => r.json())
      .then(d => { setDetail(d.exhibition); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [isOpen, ex.exhibitionId, detail]);

  const artworks = (detail?.artworks || [])
    .slice()
    .sort((a, b) => (parseInt(a.catalogueNumber) || 9999) - (parseInt(b.catalogueNumber) || 9999));

  return (
    <div className={`ex-row ${isOpen ? "open" : ""}`}>
      <button className="ex-summary" onClick={onToggle} aria-expanded={isOpen}>
        <div className="ex-year">{ex.yearText || "—"}</div>
        <div className="ex-main">
          <div className="ex-title">{ex.title}</div>
          <div className="ex-meta">
            {ex.exhibitionType && <span className="ex-type">{ex.exhibitionType}</span>}
            {ex.venue           && <span>{ex.venue}</span>}
            {ex.organiser       && <span>{ex.organiser}</span>}
            {ex.artworkCount > 0 && (
              <span className="ex-count">{ex.artworkCount} work{ex.artworkCount !== 1 ? "s" : ""}</span>
            )}
            <ReliabilityBadge value={ex.reliability} />
          </div>
        </div>
        <div className="ex-chevron">{isOpen ? "↑" : "↓"}</div>
      </button>

      {isOpen && (
        <div className="ex-detail">
          <div className="ex-detail-meta">
            {(ex.openingDate || ex.closingDate) && (
              <div className="ex-detail-row">
                <span className="ex-detail-label">Dates</span>
                <span>{[ex.openingDate, ex.closingDate].filter(Boolean).join(" – ")}</span>
              </div>
            )}
            {ex.venue && (
              <div className="ex-detail-row">
                <span className="ex-detail-label">Venue</span>
                <span>{ex.venue}</span>
              </div>
            )}
            {ex.organiser && (
              <div className="ex-detail-row">
                <span className="ex-detail-label">Organiser</span>
                <span>{ex.organiser}</span>
              </div>
            )}
            {ex.catalogueRef && (
              <div className="ex-detail-row">
                <span className="ex-detail-label">Catalogue</span>
                <span>
                  {ex.catalogueUrl
                    ? <a href={ex.catalogueUrl} target="_blank" rel="noreferrer" className="ex-cat-link">{ex.catalogueRef} ↗</a>
                    : ex.catalogueRef}
                </span>
              </div>
            )}
            {ex.reliability && (
              <div className="ex-detail-row">
                <span className="ex-detail-label">Source</span>
                <ReliabilityBadge value={ex.reliability} />
              </div>
            )}
            {ex.notes && <div className="ex-detail-notes">{ex.notes}</div>}
          </div>

          {loading && (
            <div className="ex-works-loading"><span className="ex-spinner" /> Loading exhibited works…</div>
          )}
          {error && (
            <div className="ex-works-error">Could not load artwork details: {error}</div>
          )}
          {!loading && !error && artworks.length > 0 && (
            <div className="ex-works-section">
              <div className="ex-works-heading">Works shown ({artworks.length})</div>
              <div className="ex-works-grid">
                {artworks.map((w, i) => <ExhibitedWork key={w.artworkId || i} work={w} />)}
              </div>
            </div>
          )}
          {!loading && !error && detail && artworks.length === 0 && (
            <div className="ex-works-empty">No artworks linked to this exhibition yet.</div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Historical() {
  const [exhibitions, setExhibitions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [openId, setOpenId]           = useState(null);
  const [filter, setFilter]           = useState("all");

  useEffect(() => {
    fetch("/api/exhibitions")
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        setExhibitions(d.exhibitions || []);
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const toggle = id => setOpenId(prev => prev === id ? null : id);

  const TYPES = ["all", "Solo", "Retrospective", "Annual", "Group", "Posthumous"];

  const filtered = exhibitions.filter(ex =>
    filter === "all" ? true : ex.exhibitionType === filter
  );

  const total = exhibitions.length;

  return (
    <main>
      <section className="hero">
        <article>
          <div className="hero-content">
            <div className="preheading">Exhibitions · Historical record</div>
            <h1>Historical Exhibitions</h1>
            <p>
              Every exhibition John Luke participated in during his lifetime and
              in the years following his death — with works shown, venues, dates,
              and catalogue references.
              {!loading && total > 0 && ` ${total} exhibitions on record.`}
            </p>
            <div className="btn-duo">
              <Link className="cta-primary dull" to="/exhibitions">← Back to Exhibitions</Link>
            </div>
          </div>
        </article>
      </section>

      <section className="panel light">
        <article>
          <div className="panel-content" style={{ width: "100%" }}>

            {!loading && !error && exhibitions.length > 0 && (
              <div className="ex-filter-bar">
                <span className="ex-filter-label">
                  {filtered.length} exhibition{filtered.length !== 1 ? "s" : ""}
                </span>
                <div className="ex-filter-pills">
                  {TYPES.map(t => (
                    <button key={t}
                      className={`ex-filter-pill ${filter === t ? "active" : ""}`}
                      onClick={() => { setFilter(t); setOpenId(null); }}>
                      {t === "all" ? "All types" : t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div className="ex-state">
                <div className="ex-loading-bar"><div className="ex-loading-fill" /></div>
                <p>Loading exhibition records…</p>
              </div>
            )}
            {error && !loading && (
              <div className="ex-state ex-error">
                <p><strong>Could not load exhibitions.</strong> {error}</p>
              </div>
            )}

            {!loading && !error && (
              <div className="ex-list">
                {filtered.length === 0 && (
                  <div className="ex-state">No exhibitions of this type on record.</div>
                )}
                {filtered.map(ex => (
                  <ExhibitionRow
                    key={ex.exhibitionId || ex.title}
                    ex={ex}
                    isOpen={openId === (ex.exhibitionId || ex.title)}
                    onToggle={() => toggle(ex.exhibitionId || ex.title)}
                  />
                ))}
              </div>
            )}
          </div>
        </article>
      </section>

      <style>{`
        .ex-filter-bar { display:flex; align-items:center; gap:16px; flex-wrap:wrap; margin-bottom:20px; padding-bottom:16px; border-bottom:1px solid var(--light); }
        .ex-filter-label { font-size:0.85rem; color:var(--shadow); opacity:0.5; white-space:nowrap; }
        .ex-filter-pills { display:flex; flex-wrap:wrap; gap:6px; }
        .ex-filter-pill { padding:4px 14px; border-radius:2rem; border:1px solid var(--light); background:white; color:var(--shadow); font-size:0.82rem; cursor:pointer; transition:all 0.15s; }
        .ex-filter-pill:hover { border-color:var(--primary); color:var(--primary); }
        .ex-filter-pill.active { background:var(--primary); color:white; border-color:var(--primary); font-weight:600; }

        .ex-list { display:flex; flex-direction:column; }
        .ex-row { border-bottom:1px solid var(--light); }
        .ex-row:first-child { border-top:1px solid var(--light); }
        .ex-row.open { background:#fafaf8; }

        .ex-summary { width:100%; display:grid; grid-template-columns:64px 1fr 28px; gap:16px; align-items:center; padding:16px 0; background:none; border:none; cursor:pointer; text-align:left; transition:background 0.1s; }
        .ex-summary:hover, .ex-row.open .ex-summary { background:rgba(0,0,0,0.02); }

        .ex-year { font-family:var(--ff-hx); font-size:1rem; font-weight:600; color:var(--primary); opacity:0.7; line-height:1; }
        .ex-title { font-family:var(--ff-hx); font-size:1.05rem; font-weight:500; color:var(--shadow); margin-bottom:4px; line-height:1.3; }
        .ex-meta { display:flex; flex-wrap:wrap; gap:6px 12px; align-items:center; font-size:0.8rem; color:var(--shadow); opacity:0.6; }
        .ex-type { font-weight:600; opacity:1; color:var(--primary); }
        .ex-count { font-weight:600; opacity:1; }
        .ex-chevron { color:var(--shadow); opacity:0.3; font-size:0.85rem; text-align:right; }

        .ex-reliability { display:inline-block; padding:2px 9px; border-radius:2rem; font-size:0.72rem; font-weight:600; }
        .rel-primary   { background:#e4f4e4; color:#2d6a4f; }
        .rel-major     { background:#e0ecf7; color:#2a5f8a; }
        .rel-standard  { background:#fdf3e0; color:#ae6818; }
        .rel-minor     { background:#f0f0f0; color:#6a6a6a; }
        .rel-uncertain { background:#fde8e8; color:#9b2226; }

        .ex-detail { padding:4px 0 24px 80px; }
        @media (max-width:640px) { .ex-detail { padding-left:0; } }

        .ex-detail-meta { display:flex; flex-direction:column; gap:6px; margin-bottom:20px; font-size:0.88rem; }
        .ex-detail-row { display:grid; grid-template-columns:120px 1fr; gap:8px; color:var(--shadow); }
        .ex-detail-label { color:var(--shadow); opacity:0.45; font-weight:600; font-size:0.78rem; text-transform:uppercase; letter-spacing:0.04em; padding-top:1px; }
        .ex-detail-notes { margin-top:8px; font-size:0.85rem; color:var(--shadow); opacity:0.7; font-style:italic; line-height:1.5; padding:10px 14px; background:#fffbe8; border-left:3px solid #e8c84a; border-radius:0 4px 4px 0; }
        .ex-cat-link { color:var(--primary); text-decoration:underline; text-underline-offset:2px; }

        .ex-works-section { margin-top:4px; }
        .ex-works-heading { font-size:0.78rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:var(--shadow); opacity:0.4; margin-bottom:12px; }
        .ex-works-grid { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:12px; }
        @media (max-width:1000px) { .ex-works-grid { grid-template-columns:repeat(4,minmax(0,1fr)); } }
        @media (max-width:760px)  { .ex-works-grid { grid-template-columns:repeat(3,minmax(0,1fr)); } }
        @media (max-width:500px)  { .ex-works-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }

        .ex-work { display:flex; flex-direction:column; gap:6px; }
        .ex-work-image { aspect-ratio:4/3; background:#f0ede8; border-radius:4px; overflow:hidden; display:flex; align-items:center; justify-content:center; }
        .ex-work-img-wrap { position:relative; width:100%; height:100%; }
        .ex-work-img-wrap img { width:100%; height:100%; object-fit:cover; display:block; pointer-events:none; user-select:none; -webkit-user-drag:none; }
        .ex-work-shield { position:absolute; inset:0; z-index:2; }
        .ex-work-placeholder { width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:#c8beb4; font-size:0.7rem; font-family:monospace; }

        .ex-work-info { display:flex; flex-direction:column; gap:2px; }
        .ex-work-catno   { font-size:0.7rem; font-weight:700; color:var(--primary); opacity:0.6; letter-spacing:0.04em; }
        .ex-work-title   { font-family:var(--ff-hx); font-size:0.82rem; font-weight:500; color:var(--shadow); line-height:1.3; }
        .ex-work-date    { font-size:0.72rem; color:var(--shadow); opacity:0.55; }
        .ex-work-medium  { font-size:0.7rem; color:var(--shadow); opacity:0.45; font-style:italic; }
        .ex-work-price   { font-size:0.7rem; color:var(--shadow); opacity:0.6; font-weight:600; }
        .ex-work-catnotes { font-size:0.7rem; color:var(--shadow); opacity:0.5; line-height:1.4; margin-top:2px; }

        .ex-state { text-align:center; padding:40px 20px; color:var(--shadow); opacity:0.55; }
        .ex-error { background:#fff0f0; border-radius:0.35rem; opacity:1; color:#a00; padding:20px; text-align:left; }
        .ex-loading-bar { width:160px; height:3px; background:var(--light); border-radius:2px; overflow:hidden; margin:0 auto 12px; }
        .ex-loading-fill { height:100%; background:var(--primary); animation:exLoad 1.2s ease-in-out infinite; }
        @keyframes exLoad { 0%{width:0;margin-left:0} 50%{width:60%;margin-left:20%} 100%{width:0;margin-left:100%} }
        .ex-spinner { width:13px; height:13px; border:2px solid var(--light); border-top-color:var(--primary); border-radius:50%; animation:spin 0.7s linear infinite; display:inline-block; margin-right:6px; vertical-align:middle; }
        @keyframes spin { to { transform:rotate(360deg); } }
        .ex-works-loading { font-size:0.85rem; color:var(--shadow); opacity:0.5; padding:12px 0; }
        .ex-works-error   { font-size:0.85rem; color:#a00; padding:8px 0; }
        .ex-works-empty   { font-size:0.85rem; color:var(--shadow); opacity:0.4; font-style:italic; padding:8px 0; }
      `}</style>
    </main>
  );
}
