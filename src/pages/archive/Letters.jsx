import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const TYPE_LABELS = {
  letter: "Letter", essay: "Essay", diary: "Diary entry",
  commission: "Commission", article: "Article",
  "catalogue-text": "Catalogue text", newspaper: "Newspaper",
  statement: "Statement", interview: "Interview",
};

const TYPE_GROUPS = [
  { key: "all",        label: "All" },
  { key: "letter",     label: "Letters" },
  { key: "essay",      label: "Essays & statements" },
  { key: "commission", label: "Commission documents" },
];

export default function Letters() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState("all");

  useEffect(() => {
    fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "documents_list" }),
    })
      .then(r => r.json())
      .then(d => { setDocuments(d.documents || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const visible = documents.filter(d => {
    if (filter === "all") return true;
    if (filter === "essay") return ["essay","statement","interview"].includes(d.type);
    return d.type === filter;
  });

  const byDecade = {};
  visible.forEach(d => {
    const decade = d.yearFrom ? `${Math.floor(d.yearFrom / 10) * 10}s` : "Undated";
    if (!byDecade[decade]) byDecade[decade] = [];
    byDecade[decade].push(d);
  });
  const decades = Object.keys(byDecade).sort((a, b) => {
    if (a === "Undated") return 1;
    if (b === "Undated") return -1;
    return parseInt(a) - parseInt(b);
  });

  return (
    <main>
      <style>{`
        .lt-hero-meta{display:flex;gap:24px;margin-top:20px;flex-wrap:wrap}
        .lt-hero-num{font-family:'Playfair Display',serif;font-size:2rem;color:var(--white);line-height:1}
        .lt-hero-lbl{font-size:0.7rem;letter-spacing:0.1em;text-transform:uppercase;color:var(--white);opacity:0.5;margin-top:4px}
        .lt-wrap{max-width:900px;margin:0 auto}
        .lt-filters{display:flex;gap:8px;margin-bottom:32px;flex-wrap:wrap}
        .lt-filter-btn{padding:6px 18px;border-radius:20px;font-size:0.78rem;cursor:pointer;border:1px solid var(--light);background:transparent;color:var(--shadow);transition:all 0.15s;font-family:inherit;letter-spacing:0.04em}
        .lt-filter-btn:hover{background:var(--secondary)}
        .lt-filter-btn.active{background:var(--primary);color:white;border-color:var(--primary)}
        .lt-decade{margin-bottom:40px}
        .lt-decade-label{font-size:0.65rem;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:var(--shadow);opacity:0.35;border-bottom:1px solid var(--light);padding-bottom:10px;margin-bottom:16px}
        .lt-card{display:flex;gap:20px;padding:18px 0;border-bottom:1px solid var(--light);text-decoration:none;color:inherit;transition:background 0.1s}
        .lt-card:last-child{border-bottom:none}
        .lt-card:hover .lt-card-title{color:var(--primary)}
        .lt-card-type{min-width:90px;font-size:0.65rem;letter-spacing:0.1em;text-transform:uppercase;color:var(--shadow);opacity:0.4;font-weight:700;padding-top:3px}
        .lt-card-body{flex:1}
        .lt-card-title{font-family:'Playfair Display',serif;font-size:1.05rem;color:var(--shadow);margin:0 0 5px;transition:color 0.15s;line-height:1.3}
        .lt-card-meta{font-size:0.78rem;color:var(--shadow);opacity:0.55;display:flex;gap:10px;flex-wrap:wrap;margin-bottom:8px}
        .lt-card-summary{font-size:0.82rem;color:var(--shadow);opacity:0.65;line-height:1.6}
        .lt-card-tags{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;align-items:center}
        .lt-card-tag{font-size:0.65rem;letter-spacing:0.06em;text-transform:uppercase;padding:2px 8px;border-radius:8px;background:rgba(21,89,129,0.1);color:var(--primary)}
        .lt-card-access{font-size:0.7rem;color:var(--shadow);opacity:0.45}
        .lt-card-archive{font-family:monospace;font-size:0.7rem;color:var(--shadow);opacity:0.4}
        .lt-empty{padding:48px 0;text-align:center;color:var(--shadow);opacity:0.4;font-size:0.9rem}
        .lt-intro{font-size:0.9rem;line-height:1.7;color:var(--shadow);opacity:0.75;margin-bottom:32px;max-width:680px}
      `}</style>

      <section className="hero">
        <article>
          <div className="hero-content">
            <div className="preheading">Archive · Letters & Documents</div>
            <h1>Correspondence & Writings</h1>
            <p>Private letters, essays, and documents to and from John Luke, spanning his career from his student years through to his final decade.</p>
            {!loading && documents.length > 0 && (
              <div className="lt-hero-meta">
                <div><div className="lt-hero-num">{documents.length}</div><div className="lt-hero-lbl">Documents</div></div>
                <div><div className="lt-hero-num">{documents.filter(d => d.type === "letter").length}</div><div className="lt-hero-lbl">Letters</div></div>
                <div><div className="lt-hero-num">{documents.reduce((n, d) => n + (d.excerptCount || 0), 0)}</div><div className="lt-hero-lbl">Tagged passages</div></div>
              </div>
            )}
            <div className="btn-duo" style={{ marginTop: 24 }}>
              <Link className="cta-primary dull" to="/archive">← Back to Archive</Link>
            </div>
          </div>
        </article>
      </section>

      <section className="panel light">
        <article>
          <div className="panel-content lt-wrap" style={{ width: "100%" }}>
            {loading ? (
              <div className="lt-empty">Loading…</div>
            ) : documents.length === 0 ? (
              <p className="lt-intro">
                The Letters collection is being digitised, transcribed, and annotated.
                Access to individual records will open progressively as the work is completed.
              </p>
            ) : (
              <>
                <p className="lt-intro">
                  Letters, essays, commission documents, and other written material.
                  Passages referencing specific artworks are linked directly to catalogue records.
                  Full transcriptions are available to research account holders.
                </p>
                <div className="lt-filters">
                  {TYPE_GROUPS.map(g => (
                    <button key={g.key}
                      className={`lt-filter-btn${filter === g.key ? " active" : ""}`}
                      onClick={() => setFilter(g.key)}>{g.label}</button>
                  ))}
                </div>
                {decades.length === 0 ? (
                  <div className="lt-empty">No documents in this category</div>
                ) : decades.map(decade => (
                  <div key={decade} className="lt-decade">
                    <div className="lt-decade-label">{decade}</div>
                    {byDecade[decade].map(doc => (
                      <Link key={doc.documentId}
                        to={`/archive/documents/${doc.documentId}`}
                        className="lt-card">
                        <div className="lt-card-type">{TYPE_LABELS[doc.type] || doc.type}</div>
                        <div className="lt-card-body">
                          <h3 className="lt-card-title">{doc.title}</h3>
                          <div className="lt-card-meta">
                            {doc.author && <span>{doc.author}</span>}
                            {doc.recipient && <span>to {doc.recipient}</span>}
                            {doc.dateText && <span>{doc.dateText}</span>}
                            {doc.archiveRef && <span className="lt-card-archive">{doc.archiveRef}</span>}
                          </div>
                          {doc.summary && <div className="lt-card-summary">{doc.summary}</div>}
                          {doc.excerptCount > 0 && (
                            <div className="lt-card-tags">
                              <span className="lt-card-tag">
                                {doc.excerptCount} artwork reference{doc.excerptCount > 1 ? "s" : ""}
                              </span>
                              <span className="lt-card-access">
                                {doc.accessTier === "public" ? "Open access" : "Researcher access"}
                              </span>
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                ))}
              </>
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
