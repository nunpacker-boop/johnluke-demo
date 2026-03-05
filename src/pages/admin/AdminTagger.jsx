import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { adminApi } from "./AdminShell.jsx";

const TOPICS = ["method","process","colour","commission","opinion","biography",
                "technique","material","palette","exhibition","influence","design"];

const CONFIDENCE = ["certain","probable","possible"];
const ACCESS     = ["public","researcher"];

export default function AdminTagger() {
  const { docId }  = useParams();
  const navigate   = useNavigate();
  const textRef    = useRef(null);

  const [docs, setDocs]             = useState([]);
  const [doc, setDoc]               = useState(null);
  const [selection, setSelection]   = useState(null);  // { text, start, end }
  const [panel, setPanel]           = useState(null);  // "new" | excerptId
  const [form, setForm]             = useState(defaultForm());
  const [artworkSearch, setArtworkSearch] = useState("");
  const [artworkResults, setArtworkResults] = useState([]);
  const [saving, setSaving]         = useState(false);
  const [msg, setMsg]               = useState(null);
  const [excerpts, setExcerpts]     = useState([]);
  const [editingExcerpt, setEditingExcerpt] = useState(null);

  function defaultForm() {
    return { context: "", accessTier: "researcher", confidence: "certain",
             altTitleUsed: "", topics: [], artworkId: null, artworkTitle: "" };
  }

  // Load doc list
  useEffect(() => {
    adminApi("documents_list").then(d => setDocs(d.documents)).catch(() => {});
  }, []);

  // Load selected doc
  useEffect(() => {
    if (!docId) return;
    adminApi("document_get", { id: docId }).then(d => {
      setDoc(d.document);
      setExcerpts((d.document?.excerpts || []).filter(e => e.excerptId));
    }).catch(e => setMsg({ type: "error", text: e.message }));
  }, [docId]);

  // Artwork search
  useEffect(() => {
    if (!artworkSearch.trim()) { setArtworkResults([]); return; }
    const t = setTimeout(() => {
      adminApi("artworks_search", { q: artworkSearch })
        .then(d => setArtworkResults(d.artworks))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [artworkSearch]);

  // Capture text selection
  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    const text = sel.toString().trim();
    if (text.length < 10) return;
    setSelection({ text });
    setPanel("new");
    setForm(defaultForm());
    setArtworkSearch("");
    setArtworkResults([]);
  };

  const setF = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const toggleTopic = (t) => setF("topics",
    form.topics.includes(t) ? form.topics.filter(x => x !== t) : [...form.topics, t]
  );

  const saveExcerpt = async () => {
    if (!selection?.text) return;
    setSaving(true);
    setMsg(null);
    try {
      const d = await adminApi("excerpt_create", {
        documentId: doc.documentId,
        text: selection.text,
        ...form,
      });
      const newEx = {
        excerptId: d.excerptId, text: selection.text,
        context: form.context, accessTier: form.accessTier,
        confidence: form.confidence, altTitleUsed: form.altTitleUsed,
        topics: form.topics, artworkId: form.artworkId,
        artworkTitle: form.artworkTitle,
      };
      setExcerpts(prev => [...prev, newEx]);
      setMsg({ type: "success", text: "Excerpt saved" });
      setPanel(null);
      setSelection(null);
      window.getSelection()?.removeAllRanges();
    } catch (e) { setMsg({ type: "error", text: e.message }); }
    setSaving(false);
  };

  const deleteExcerpt = async (excerptId) => {
    if (!confirm("Delete this excerpt?")) return;
    try {
      await adminApi("excerpt_delete", { id: excerptId });
      setExcerpts(prev => prev.filter(e => e.excerptId !== excerptId));
      if (panel === excerptId) setPanel(null);
    } catch (e) { setMsg({ type: "error", text: e.message }); }
  };

  const selectArtwork = (a) => {
    setF("artworkId", a.artworkId);
    setF("artworkTitle", a.title);
    setArtworkSearch(a.title);
    setArtworkResults([]);
  };

  // Highlight excerpts in document text
  const renderText = () => {
    if (!doc?.fullText) return null;
    const text = doc.fullText;
    if (excerpts.length === 0) return <span>{text}</span>;

    // Find all excerpt positions
    const marks = [];
    excerpts.forEach(ex => {
      let idx = 0;
      while (true) {
        const pos = text.indexOf(ex.text, idx);
        if (pos === -1) break;
        marks.push({ start: pos, end: pos + ex.text.length, excerptId: ex.excerptId,
          accessTier: ex.accessTier, artworkTitle: ex.artworkTitle });
        idx = pos + 1;
      }
    });
    marks.sort((a, b) => a.start - b.start);

    // Merge overlapping
    const merged = [];
    for (const m of marks) {
      if (merged.length && m.start < merged[merged.length - 1].end) {
        merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, m.end);
      } else merged.push({ ...m });
    }

    const parts = [];
    let cursor = 0;
    for (const m of merged) {
      if (m.start > cursor) parts.push({ type: "text", content: text.slice(cursor, m.start) });
      parts.push({ type: "mark", content: text.slice(m.start, m.end), ...m });
      cursor = m.end;
    }
    if (cursor < text.length) parts.push({ type: "text", content: text.slice(cursor) });

    return parts.map((p, i) =>
      p.type === "text" ? <span key={i}>{p.content}</span> : (
        <mark key={i}
          onClick={() => setPanel(p.excerptId)}
          style={{
            background: p.accessTier === "public" ? "rgba(74,144,96,0.25)" : "rgba(74,127,165,0.25)",
            borderBottom: `2px solid ${p.accessTier === "public" ? "#4a9060" : "#4a7fa5"}`,
            cursor: "pointer", borderRadius: 2, color: "inherit",
          }}
          title={p.artworkTitle || "Tagged excerpt"}
        >{p.content}</mark>
      )
    );
  };

  const panelExcerpt = panel && panel !== "new"
    ? excerpts.find(e => e.excerptId === panel)
    : null;

  return (
    <div style={{ display: "flex", gap: 0, height: "calc(100vh - 104px)" }}>

      {/* Doc picker sidebar */}
      <div style={{
        width: 220, minWidth: 220, borderRight: "1px solid #1a2030",
        display: "flex", flexDirection: "column", paddingRight: 16, marginRight: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span className="adm-label" style={{ margin: 0 }}>Documents</span>
          <Link to="/admin/documents" className="adm-btn adm-btn-secondary"
            style={{ textDecoration: "none", padding: "4px 8px" }}>+ New</Link>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {docs.map(d => (
            <div key={d.documentId}
              onClick={() => navigate(`/admin/tagger/${d.documentId}`)}
              style={{
                padding: "8px 10px", cursor: "pointer", borderRadius: 4,
                background: docId === d.documentId ? "#0d1826" : "transparent",
                borderLeft: docId === d.documentId ? "2px solid #4a7fa5" : "2px solid transparent",
                marginBottom: 2,
              }}
            >
              <div style={{ fontSize: "0.72rem", color: "#8a9aaa" }}>{d.title || d.documentId}</div>
              <div style={{ fontSize: "0.62rem", color: "#3a5068", marginTop: 2 }}>
                {d.dateText || "—"} · {d.excerptCount || 0} excerpts
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Document text */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {!doc ? (
          <div className="adm-empty" style={{ marginTop: 80 }}>
            {docId ? "Loading document…" : "Select a document to begin tagging"}
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 12 }}>
              <h2 style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: "0.9rem", color: "#c8cdd6", margin: "0 0 4px" }}>
                {doc.title}
              </h2>
              <div style={{ fontSize: "0.65rem", color: "#3a5068" }}>
                {doc.author}{doc.recipient ? ` → ${doc.recipient}` : ""} · {doc.dateText || "Undated"}
                {doc.archiveRef && ` · ${doc.archiveRef}`}
                · <span style={{ color: "#4a7060" }}>{excerpts.length} excerpts tagged</span>
              </div>
              <div style={{ marginTop: 8, fontSize: "0.62rem", color: "#3a5068", fontStyle: "italic" }}>
                Select any passage in the text below to create a tagged excerpt
              </div>
            </div>

            {msg && <div className={`adm-msg-${msg.type}`}>{msg.text}</div>}

            <div
              ref={textRef}
              onMouseUp={handleMouseUp}
              style={{
                flex: 1, overflowY: "auto",
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: "0.82rem", lineHeight: 1.8, color: "#9aaab8",
                whiteSpace: "pre-wrap", userSelect: "text",
                padding: "16px 20px", background: "#080c10",
                border: "1px solid #1a2030", borderRadius: 6,
              }}
            >
              {doc.fullText ? renderText() : (
                <span style={{ color: "#3a5068", fontStyle: "italic" }}>
                  No full text — add it in the Documents section
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Tag panel */}
      {panel && (
        <div style={{
          width: 320, minWidth: 320, marginLeft: 16,
          borderLeft: "1px solid #1a2030", paddingLeft: 16,
          display: "flex", flexDirection: "column", overflowY: "auto",
        }}>

          {panel === "new" ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <span className="adm-label" style={{ margin: 0 }}>New excerpt</span>
                <button className="adm-btn adm-btn-secondary" style={{ padding: "3px 8px" }}
                  onClick={() => { setPanel(null); setSelection(null); }}>✕</button>
              </div>

              {/* Selected text preview */}
              <div style={{
                padding: "10px 12px", background: "#060a0f",
                border: "1px solid #1e2a38", borderRadius: 4,
                marginBottom: 14, fontSize: "0.75rem", fontFamily: "Georgia,serif",
                fontStyle: "italic", color: "#7a9aaa", lineHeight: 1.6,
                maxHeight: 120, overflow: "auto",
              }}>
                "{selection?.text}"
              </div>

              {/* Artwork link */}
              <div style={{ marginBottom: 12 }}>
                <label className="adm-label">Link to artwork</label>
                <div style={{ position: "relative" }}>
                  <input className="adm-input"
                    placeholder="Search artwork title…"
                    value={artworkSearch}
                    onChange={e => { setArtworkSearch(e.target.value); if (!e.target.value) { setF("artworkId", null); setF("artworkTitle",""); }}}
                  />
                  {artworkResults.length > 0 && (
                    <div style={{
                      position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100,
                      background: "#0d1218", border: "1px solid #1e2a38", borderRadius: 4,
                      maxHeight: 200, overflowY: "auto",
                    }}>
                      {artworkResults.map(a => (
                        <div key={a.artworkId} onClick={() => selectArtwork(a)}
                          style={{ padding: "8px 10px", cursor: "pointer", display: "flex", gap: 8, alignItems: "center" }}
                          onMouseEnter={e => e.currentTarget.style.background = "#131e2a"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >
                          {a.thumbnailUrl && <img src={a.thumbnailUrl} style={{ width: 28, height: 28, objectFit: "cover", borderRadius: 2 }} alt="" />}
                          <div>
                            <div style={{ fontSize: "0.72rem", color: "#9aaab8" }}>{a.title}</div>
                            <div style={{ fontSize: "0.62rem", color: "#3a5068" }}>{a.yearFrom || "Undated"}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {form.artworkId && (
                  <div style={{ marginTop: 6, fontSize: "0.65rem", color: "#4a7fa5" }}>
                    → {form.artworkTitle}
                    <button onClick={() => { setF("artworkId", null); setF("artworkTitle",""); setArtworkSearch(""); }}
                      style={{ background: "none", border: "none", color: "#5a6878", cursor: "pointer", marginLeft: 6 }}>✕</button>
                  </div>
                )}
              </div>

              {/* Alt title */}
              <div style={{ marginBottom: 12 }}>
                <label className="adm-label">Alt title used in text</label>
                <input className="adm-input" placeholder="e.g. 'the Circus picture'"
                  value={form.altTitleUsed} onChange={e => setF("altTitleUsed", e.target.value)} />
              </div>

              {/* Context note */}
              <div style={{ marginBottom: 12 }}>
                <label className="adm-label">Editorial context</label>
                <textarea className="adm-textarea" style={{ minHeight: 60 }}
                  placeholder="Brief note explaining significance…"
                  value={form.context} onChange={e => setF("context", e.target.value)} />
              </div>

              {/* Access + confidence */}
              <div className="adm-row" style={{ marginBottom: 12 }}>
                <div className="adm-col">
                  <label className="adm-label">Access</label>
                  <select className="adm-select" value={form.accessTier} onChange={e => setF("accessTier", e.target.value)}>
                    {ACCESS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div className="adm-col">
                  <label className="adm-label">Confidence</label>
                  <select className="adm-select" value={form.confidence} onChange={e => setF("confidence", e.target.value)}>
                    {CONFIDENCE.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Topics */}
              <div style={{ marginBottom: 16 }}>
                <label className="adm-label">Topics</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {TOPICS.map(t => (
                    <button key={t} onClick={() => toggleTopic(t)}
                      style={{
                        padding: "3px 10px", borderRadius: 10,
                        background: form.topics.includes(t) ? "#1e4060" : "transparent",
                        border: `1px solid ${form.topics.includes(t) ? "#2a5878" : "#1e2a38"}`,
                        color: form.topics.includes(t) ? "#7ab3d4" : "#4a6070",
                        fontSize: "0.65rem", cursor: "pointer",
                        letterSpacing: "0.06em", textTransform: "uppercase",
                        fontFamily: "'IBM Plex Mono',monospace",
                      }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <button className="adm-btn adm-btn-primary" onClick={saveExcerpt} disabled={saving}>
                {saving ? "Saving…" : "Save excerpt"}
              </button>
            </>

          ) : panelExcerpt ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <span className="adm-label" style={{ margin: 0 }}>Tagged excerpt</span>
                <button className="adm-btn adm-btn-secondary" style={{ padding: "3px 8px" }}
                  onClick={() => setPanel(null)}>✕</button>
              </div>

              <div style={{
                padding: "10px 12px", background: "#060a0f",
                border: "1px solid #1e2a38", borderRadius: 4,
                marginBottom: 14, fontSize: "0.75rem", fontFamily: "Georgia,serif",
                fontStyle: "italic", color: "#7a9aaa", lineHeight: 1.6,
                maxHeight: 160, overflow: "auto",
              }}>
                "{panelExcerpt.text}"
              </div>

              <div style={{ marginBottom: 8 }}>
                {panelExcerpt.artworkTitle && (
                  <div style={{ fontSize: "0.72rem", color: "#4a7fa5", marginBottom: 6 }}>
                    → <a href={`/works/${panelExcerpt.artworkId}`} target="_blank"
                      style={{ color: "inherit" }}>{panelExcerpt.artworkTitle}</a>
                  </div>
                )}
                {panelExcerpt.context && (
                  <div style={{ fontSize: "0.72rem", color: "#6a7a8a", marginBottom: 6, fontStyle: "italic" }}>
                    {panelExcerpt.context}
                  </div>
                )}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span className={`adm-badge adm-badge-${panelExcerpt.accessTier}`}>{panelExcerpt.accessTier}</span>
                  <span className={`adm-badge adm-badge-${panelExcerpt.confidence}`}>{panelExcerpt.confidence}</span>
                  {(panelExcerpt.topics || []).map(t => (
                    <span key={t} className="adm-badge" style={{ background: "#1a2030", color: "#5a7080" }}>{t}</span>
                  ))}
                </div>
              </div>

              <hr className="adm-divider" />
              <button className="adm-btn adm-btn-danger"
                onClick={() => deleteExcerpt(panelExcerpt.excerptId)}>
                Delete excerpt
              </button>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
