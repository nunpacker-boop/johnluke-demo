import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";

// TODO: replace with real auth check
const IS_RESEARCHER = false;

export default function DocumentViewer() {
  const { documentId } = useParams();
  const [doc, setDoc]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [activeExcerpt, setActiveExcerpt] = useState(null);
  const tooltipRef = useRef(null);

  const tier = IS_RESEARCHER ? "researcher" : "public";

  useEffect(() => {
    if (!documentId) return;
    setLoading(true);
    fetch(`/api/document?id=${encodeURIComponent(documentId)}&tier=${tier}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        if (!d.document) throw new Error("Document not found");
        setDoc(d.document);
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [documentId]);

  // Render full text with excerpt highlights
  const renderFullText = () => {
    if (!doc?.fullText) return null;
    const text = doc.fullText;
    const excerpts = (doc.excerpts || []).filter(e => e.text && text.includes(e.text));

    if (excerpts.length === 0) return <span style={{ whiteSpace: "pre-wrap" }}>{text}</span>;

    // Find all positions
    const marks = [];
    excerpts.forEach(ex => {
      let idx = 0;
      while (true) {
        const pos = text.indexOf(ex.text, idx);
        if (pos === -1) break;
        marks.push({ start: pos, end: pos + ex.text.length, excerpt: ex });
        idx = pos + 1;
      }
    });
    marks.sort((a, b) => a.start - b.start);

    // Build segments
    const parts = [];
    let cursor = 0;
    for (const m of marks) {
      if (m.start > cursor) {
        parts.push({ type: "text", content: text.slice(cursor, m.start) });
      }
      parts.push({ type: "mark", content: text.slice(m.start, m.end), excerpt: m.excerpt });
      cursor = m.end;
    }
    if (cursor < text.length) parts.push({ type: "text", content: text.slice(cursor) });

    return parts.map((p, i) => {
      if (p.type === "text") {
        return <span key={i} style={{ whiteSpace: "pre-wrap" }}>{p.content}</span>;
      }
      const isPublic = p.excerpt.accessTier === "public";
      const isActive = activeExcerpt?.excerptId === p.excerpt.excerptId;
      return (
        <mark key={i}
          onClick={() => setActiveExcerpt(isActive ? null : p.excerpt)}
          style={{
            background: isActive
              ? (isPublic ? "rgba(21,89,129,0.2)" : "rgba(57,123,162,0.2)")
              : (isPublic ? "rgba(21,89,129,0.1)" : "rgba(57,123,162,0.1)"),
            borderBottom: `2px solid ${isPublic ? "var(--primary)" : "var(--accent)"}`,
            cursor: "pointer", borderRadius: 2, color: "inherit",
            transition: "background 0.15s",
          }}
        >{p.content}</mark>
      );
    });
  };

  const typeLabel = (type) => {
    const labels = { letter: "Letter", essay: "Essay", diary: "Diary entry",
      commission: "Commission document", article: "Article",
      "catalogue-text": "Catalogue text", newspaper: "Newspaper article",
      statement: "Artist statement", interview: "Interview" };
    return labels[type] || type;
  };

  if (loading) return (
    <div style={{ padding: "80px 32px", textAlign: "center", color: "var(--shadow)", opacity: 0.5 }}>
      Loading…
    </div>
  );

  if (error || !doc) return (
    <div style={{ padding: "80px 32px", textAlign: "center" }}>
      <p style={{ color: "var(--shadow)" }}>{error || "Document not found"}</p>
      <Link to="/archive/letters" style={{ color: "var(--primary)" }}>← Back to archive</Link>
    </div>
  );

  const publicExcerpts   = (doc.excerpts || []).filter(e => e.accessTier === "public");
  const researchExcerpts = (doc.excerpts || []).filter(e => e.accessTier === "researcher");

  return (
    <div>
      <style>{`
        .dv-wrap { max-width: 1100px; margin: 0 auto; padding: 48px 32px; }

        .dv-back { font-size: 0.8rem; color: var(--primary); text-decoration: none;
          letter-spacing: 0.06em; text-transform: uppercase; display: inline-block;
          margin-bottom: 32px; }
        .dv-back:hover { text-decoration: underline; }

        .dv-header { margin-bottom: 40px; }
        .dv-type { font-size: 0.72rem; letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--shadow); opacity: 0.45; margin-bottom: 8px; font-weight: 700; }
        .dv-title { font-family: 'Playfair Display', serif; font-size: 1.8rem;
          color: var(--shadow); margin: 0 0 12px; line-height: 1.3; }
        .dv-meta { font-size: 0.82rem; color: var(--shadow); opacity: 0.6;
          display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
        .dv-meta-sep { opacity: 0.3; }
        .dv-archive-ref { font-size: 0.72rem; font-family: monospace;
          background: var(--light); padding: 2px 8px; border-radius: 3px; }

        .dv-layout { display: grid; grid-template-columns: 1fr 320px; gap: 48px;
          align-items: start; }
        @media (max-width: 900px) { .dv-layout { grid-template-columns: 1fr; } }

        /* Document text */
        .dv-text-area { }
        .dv-summary {
          font-size: 0.9rem; line-height: 1.7; color: var(--shadow); opacity: 0.75;
          padding: 16px 20px; background: var(--secondary);
          border-radius: 6px; margin-bottom: 28px;
        }
        .dv-text-label { font-size: 0.65rem; letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--shadow); opacity: 0.4; margin-bottom: 16px; font-weight: 700; }
        .dv-text {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 0.92rem; line-height: 1.9; color: var(--shadow);
        }
        .dv-locked {
          padding: 32px 24px; background: var(--secondary);
          border: 1px solid var(--light); border-radius: 6px;
          text-align: center;
        }
        .dv-locked-title { font-family: 'Playfair Display', serif;
          font-size: 1.1rem; color: var(--shadow); margin-bottom: 10px; }
        .dv-locked-text { font-size: 0.85rem; color: var(--shadow); opacity: 0.65;
          line-height: 1.6; margin-bottom: 20px; }
        .dv-locked-btn { display: inline-block; padding: 10px 24px;
          background: var(--primary); color: white; text-decoration: none;
          border-radius: 4px; font-size: 0.82rem; letter-spacing: 0.04em; }

        /* Sidebar */
        .dv-sidebar { position: sticky; top: 24px; }
        .dv-sidebar-section { margin-bottom: 28px; }
        .dv-sidebar-label { font-size: 0.65rem; letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--shadow); opacity: 0.4; margin-bottom: 12px; font-weight: 700; }

        .dv-ref-card {
          border: 1px solid var(--light); border-radius: 6px;
          padding: 14px 16px; margin-bottom: 10px; cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
          border-left: 3px solid var(--primary);
        }
        .dv-ref-card:hover { background: var(--secondary); }
        .dv-ref-card.active { background: var(--secondary); border-color: var(--primary); }
        .dv-ref-card-inner { display: flex; gap: 10px; align-items: flex-start; }
        .dv-ref-thumb { width: 44px; height: 44px; object-fit: cover; border-radius: 3px;
          flex-shrink: 0; background: var(--light); }
        .dv-ref-thumb-ph { width: 44px; height: 44px; border-radius: 3px;
          background: var(--light); display: flex; align-items: center; justify-content: center;
          color: var(--shadow); opacity: 0.3; font-size: 1.2rem; flex-shrink: 0; }
        .dv-ref-title { font-size: 0.82rem; color: var(--shadow); font-weight: 500;
          margin-bottom: 3px; line-height: 1.3; }
        .dv-ref-year { font-size: 0.72rem; color: var(--shadow); opacity: 0.5; }
        .dv-ref-excerpt { font-size: 0.75rem; color: var(--shadow); opacity: 0.65;
          font-style: italic; margin-top: 8px; line-height: 1.5;
          display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;
          overflow: hidden; }
        .dv-ref-context { font-size: 0.72rem; color: var(--primary); margin-top: 6px; }
        .dv-ref-link { font-size: 0.72rem; color: var(--primary); text-decoration: none;
          display: inline-block; margin-top: 8px; }
        .dv-ref-link:hover { text-decoration: underline; }

        .dv-teaser { padding: 14px 16px; background: var(--secondary);
          border: 1px solid var(--light); border-radius: 6px;
          font-size: 0.8rem; color: var(--shadow); line-height: 1.5; }

        .dv-key { display: flex; gap: 16px; margin-bottom: 12px; flex-wrap: wrap; }
        .dv-key-item { display: flex; align-items: center; gap: 6px;
          font-size: 0.7rem; color: var(--shadow); opacity: 0.6; }
        .dv-key-swatch { width: 20px; height: 3px; border-radius: 1px; }
      `}</style>

      <div className="dv-wrap">
        <Link to="/archive/letters" className="dv-back">← Archive</Link>

        {/* Header */}
        <div className="dv-header">
          <div className="dv-type">{typeLabel(doc.type)}</div>
          <h1 className="dv-title">{doc.title}</h1>
          <div className="dv-meta">
            {doc.author && <span>{doc.author}</span>}
            {doc.recipient && <><span className="dv-meta-sep">→</span><span>{doc.recipient}</span></>}
            {doc.dateText && <><span className="dv-meta-sep">·</span><span>{doc.dateText}</span></>}
            {doc.source && <><span className="dv-meta-sep">·</span><span>{doc.source}</span></>}
            {doc.archiveRef && <span className="dv-archive-ref">{doc.archiveRef}</span>}
          </div>
        </div>

        <div className="dv-layout">

          {/* Left — text */}
          <div className="dv-text-area">
            {doc.summary && (
              <div className="dv-summary">{doc.summary}</div>
            )}

            {doc.fullText ? (
              <>
                {doc.excerpts?.length > 0 && (
                  <div className="dv-key">
                    <div className="dv-key-item">
                      <div className="dv-key-swatch" style={{ background: "var(--primary)" }} />
                      Artwork reference
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--shadow)", opacity: 0.5 }}>
                      Click highlighted passages to see linked artwork
                    </div>
                  </div>
                )}
                <div className="dv-text-label">Full transcription</div>
                <div className="dv-text">{renderFullText()}</div>
              </>
            ) : (
              <div className="dv-locked">
                <div className="dv-locked-title">Full text available to researchers</div>
                <div className="dv-locked-text">
                  The complete transcription of this {typeLabel(doc.type).toLowerCase()},
                  including all cross-referenced passages, is available to research account holders.
                </div>
                <a href="/access" className="dv-locked-btn">Learn about research access</a>
              </div>
            )}
          </div>

          {/* Right — sidebar */}
          <aside className="dv-sidebar">

            {/* Artworks referenced */}
            {(doc.excerpts || []).length > 0 && (
              <div className="dv-sidebar-section">
                <div className="dv-sidebar-label">
                  Artworks referenced
                </div>
                {/* Deduplicate by artworkId */}
                {[...new Map(
                  (doc.excerpts || [])
                    .filter(e => e.artworkId)
                    .map(e => [e.artworkId, e])
                ).values()].map((ex, i) => (
                  <div key={i}
                    className={`dv-ref-card${activeExcerpt?.artworkId === ex.artworkId ? " active" : ""}`}
                    onClick={() => setActiveExcerpt(
                      activeExcerpt?.artworkId === ex.artworkId ? null : ex
                    )}
                  >
                    <div className="dv-ref-card-inner">
                      {ex.artworkThumb
                        ? <img src={ex.artworkThumb} className="dv-ref-thumb" alt="" />
                        : <div className="dv-ref-thumb-ph">◎</div>
                      }
                      <div>
                        <div className="dv-ref-title">{ex.artworkTitle}</div>
                        <div className="dv-ref-year">{ex.artworkYear || "Undated"}</div>
                        {ex.context && (
                          <div className="dv-ref-context">{ex.context}</div>
                        )}
                        {ex.altTitleUsed && (
                          <div style={{ fontSize: "0.7rem", color: "var(--shadow)", opacity: 0.5,
                            fontStyle: "italic", marginTop: 4 }}>
                            referred to as "{ex.altTitleUsed}"
                          </div>
                        )}
                        <Link to={`/works/${ex.artworkId}`} className="dv-ref-link"
                          onClick={e => e.stopPropagation()}>
                          View artwork →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}

                {researchExcerpts.length > 0 && !IS_RESEARCHER && (
                  <div className="dv-teaser">
                    <strong style={{ color: "var(--primary)" }}>
                      {researchExcerpts.length} further reference{researchExcerpts.length > 1 ? "s" : ""}
                    </strong>
                    {" "}visible to research account holders.
                  </div>
                )}
              </div>
            )}

            {/* Active excerpt detail */}
            {activeExcerpt && (
              <div className="dv-sidebar-section">
                <div className="dv-sidebar-label">Selected passage</div>
                <div style={{ fontSize: "0.82rem", fontFamily: "Georgia, serif",
                  fontStyle: "italic", color: "var(--shadow)", lineHeight: 1.7,
                  padding: "12px 16px", background: "var(--secondary)",
                  borderRadius: 6, borderLeft: "3px solid var(--primary)" }}>
                  &ldquo;{activeExcerpt.text?.slice(0, 300)}{activeExcerpt.text?.length > 300 ? "…" : ""}&rdquo;
                </div>
                {activeExcerpt.context && (
                  <div style={{ fontSize: "0.78rem", color: "var(--shadow)", opacity: 0.65,
                    fontStyle: "italic", marginTop: 10, lineHeight: 1.5 }}>
                    {activeExcerpt.context}
                  </div>
                )}
                {activeExcerpt.artworkId && (
                  <Link to={`/works/${activeExcerpt.artworkId}`}
                    style={{ display: "inline-block", marginTop: 12, fontSize: "0.78rem",
                      color: "var(--primary)", textDecoration: "none" }}>
                    View {activeExcerpt.artworkTitle} →
                  </Link>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
