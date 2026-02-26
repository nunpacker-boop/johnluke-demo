import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function Historical() {
  const [exhibitions, setExhibitions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
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

  const TYPES = ["all", "Solo", "Retrospective", "Annual", "Group", "Posthumous"];
  const filtered = exhibitions.filter(ex =>
    filter === "all" ? true : ex.exhibitionType === filter
  );

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
              {!loading && exhibitions.length > 0 && ` ${exhibitions.length} exhibitions on record.`}
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
                      onClick={() => setFilter(t)}>
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
                  <div key={ex.exhibitionId || ex.title} className="ex-row">
                    <div className="ex-year">{ex.yearText || "—"}</div>
                    <div className="ex-main">
                      <div className="ex-title">{ex.title}</div>
                      <div className="ex-meta">
                        {ex.exhibitionType && <span className="ex-type">{ex.exhibitionType}</span>}
                        {ex.venue && <span>{ex.venue}</span>}
                        {ex.artworkCount > 0 && (
                          <span className="ex-count">
                            {ex.artworkCount} work{ex.artworkCount !== 1 ? "s" : ""} catalogued
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ex-action">
                      {ex.exhibitionId && (
                        <Link
                          to={`/exhibitions/historical/${ex.exhibitionId}`}
                          className="ex-readmore">
                          View catalogue →
                        </Link>
                      )}
                    </div>
                  </div>
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
        .ex-row { display:grid; grid-template-columns:64px 1fr auto; gap:16px; align-items:center; padding:16px 0; border-bottom:1px solid var(--light); }
        .ex-row:first-child { border-top:1px solid var(--light); }

        .ex-year { font-family:var(--ff-hx); font-size:1rem; font-weight:600; color:var(--primary); opacity:0.7; }
        .ex-title { font-family:var(--ff-hx); font-size:1.05rem; font-weight:500; color:var(--shadow); margin-bottom:5px; line-height:1.3; }
        .ex-meta { display:flex; flex-wrap:wrap; gap:6px 12px; align-items:center; font-size:0.8rem; color:var(--shadow); opacity:0.6; }
        .ex-type { font-weight:600; opacity:1; color:var(--primary); }
        .ex-count { font-weight:600; opacity:1; }

        .ex-action { flex-shrink:0; }
        .ex-readmore { font-size:0.82rem; color:var(--primary); text-decoration:none; font-weight:600; white-space:nowrap; border:1px solid var(--primary); padding:5px 12px; border-radius:0.25rem; transition:all 0.15s; opacity:0.7; }
        .ex-readmore:hover { opacity:1; background:var(--primary); color:white; }

        .ex-state { text-align:center; padding:40px 20px; color:var(--shadow); opacity:0.55; }
        .ex-error { background:#fff0f0; border-radius:0.35rem; opacity:1; color:#a00; padding:20px; text-align:left; }
        .ex-loading-bar { width:160px; height:3px; background:var(--light); border-radius:2px; overflow:hidden; margin:0 auto 12px; }
        .ex-loading-fill { height:100%; background:var(--primary); animation:exLoad 1.2s ease-in-out infinite; }
        @keyframes exLoad { 0%{width:0;margin-left:0} 50%{width:60%;margin-left:20%} 100%{width:0;margin-left:100%} }
      `}</style>
    </main>
  );
}
