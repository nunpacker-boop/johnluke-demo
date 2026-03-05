import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { adminApi } from "./AdminShell.jsx";

const DOC_TYPES = ["letter","essay","diary","commission","article","catalogue-text","newspaper","statement","interview"];

const EMPTY = {
  title: "", type: "letter", author: "John Luke", recipient: "",
  dateText: "", yearFrom: "", archiveRef: "", source: "JLF Archive",
  summary: "", accessTier: "researcher", fullText: "",
};

export default function AdminDocuments() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [docs, setDocs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing]   = useState(null);
  const [isNew, setIsNew]       = useState(false);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState(null);
  const [images, setImages]       = useState([]);
  const [depictsArtwork, setDepictsArtwork] = useState(null);
  const [artworkSearch, setArtworkSearch]   = useState("");
  const [artworkResults, setArtworkResults] = useState([]);
  const [imgForm, setImgForm]   = useState({ page: "", imageUrl: "", thumbnailUrl: "",
    imageSlug: "", caption: "", accessTier: "researcher" });
  const [addingImg, setAddingImg] = useState(false);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const d = await adminApi("documents_list");
      setDocs(d.documents);
    } catch (e) { setMsg({ type: "error", text: e.message }); }
    setLoading(false);
  };

  useEffect(() => { loadDocs(); }, []);

  useEffect(() => {
    if (id && docs.length) openDoc(id);
  }, [id, docs.length]);

  const openDoc = async (docId) => {
    setIsNew(false);
    setMsg(null);
    try {
      const d = await adminApi("document_get", { id: docId });
      setSelected(d.document);
      setEditing({ ...d.document });
      navigate(`/admin/documents/${docId}`, { replace: true });
    } catch (e) { setMsg({ type: "error", text: e.message }); }
  };

  const newDoc = () => {
    setIsNew(true);
    setSelected(null);
    setEditing({ ...EMPTY });
    setMsg(null);
    navigate("/admin/documents", { replace: true });
  };

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      if (isNew) {
        const d = await adminApi("document_create", {
          ...editing,
          yearFrom: parseInt(editing.yearFrom) || null,
        });
        setIsNew(false);
        await loadDocs();
        openDoc(d.documentId);
      } else {
        await adminApi("document_update", {
          id: selected.documentId,
          fields: { ...editing, yearFrom: parseInt(editing.yearFrom) || null },
        });
        setMsg({ type: "success", text: "Saved" });
        setDocs(prev => prev.map(d =>
          d.documentId === selected.documentId ? { ...d, ...editing } : d
        ));
      }
    } catch (e) { setMsg({ type: "error", text: e.message }); }
    setSaving(false);
  };

  const set = (k, v) => setEditing(prev => ({ ...prev, [k]: v }));

  return (
    <div style={{ display: "flex", gap: 24, height: "calc(100vh - 104px)" }}>

      {/* List */}
      <div style={{ width: 300, minWidth: 300, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h1 className="adm-page-title" style={{ margin: 0 }}>
            Documents <span style={{ color: "#3a5068", fontSize: "0.75rem" }}>{docs.length}</span>
          </h1>
          <button className="adm-btn adm-btn-primary" onClick={newDoc}>+ New</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div className="adm-empty">Loading…</div>
          ) : docs.length === 0 ? (
            <div className="adm-empty">No documents yet</div>
          ) : docs.map(d => (
            <div
              key={d.documentId}
              onClick={() => openDoc(d.documentId)}
              style={{
                padding: "10px 12px", cursor: "pointer", borderRadius: 4,
                background: selected?.documentId === d.documentId ? "#0d1826" : "transparent",
                borderLeft: selected?.documentId === d.documentId ? "2px solid #5a9070" : "2px solid transparent",
                marginBottom: 2,
              }}
            >
              <div style={{ fontSize: "0.75rem", color: "#9aaab8" }}>
                {d.title || d.documentId}
              </div>
              <div style={{ fontSize: "0.65rem", color: "#3a5068", marginTop: 3, display: "flex", gap: 8 }}>
                <span>{d.dateText || "Undated"}</span>
                <span style={{ color: "#2a4050" }}>·</span>
                <span style={{ textTransform: "capitalize" }}>{d.type}</span>
                {d.excerptCount > 0 && (
                  <>
                    <span style={{ color: "#2a4050" }}>·</span>
                    <span style={{ color: "#4a8060" }}>{d.excerptCount} excerpts</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit pane */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {!editing ? (
          <div className="adm-empty" style={{ marginTop: 80 }}>
            Select a document or create a new one
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: "1rem", color: "#c8cdd6", margin: 0 }}>
                {isNew ? "New document" : editing.title || "Untitled"}
              </h2>
              <div style={{ display: "flex", gap: 8 }}>
                {!isNew && selected && (
                  <Link
                    to={`/admin/tagger/${selected.documentId}`}
                    className="adm-btn adm-btn-secondary"
                    style={{ textDecoration: "none" }}
                  >
                    ⌗ Open in tagger
                  </Link>
                )}
                <button className="adm-btn adm-btn-primary" onClick={save} disabled={saving}>
                  {saving ? "Saving…" : isNew ? "Create" : "Save"}
                </button>
              </div>
            </div>

            {msg && <div className={`adm-msg-${msg.type}`}>{msg.text}</div>}

            <div className="adm-card">
              <span className="adm-label">Metadata</span>
              <div className="adm-row">
                <div className="adm-col-2">
                  <label className="adm-label">Title</label>
                  <input className="adm-input" value={editing.title || ""} onChange={e => set("title", e.target.value)} placeholder="e.g. Letter to John Hewitt, December 1943" />
                </div>
                <div className="adm-col">
                  <label className="adm-label">Type</label>
                  <select className="adm-select" value={editing.type || "letter"} onChange={e => set("type", e.target.value)}>
                    {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="adm-row">
                <div className="adm-col">
                  <label className="adm-label">Author</label>
                  <input className="adm-input" value={editing.author || ""} onChange={e => set("author", e.target.value)} />
                </div>
                <div className="adm-col">
                  <label className="adm-label">Recipient</label>
                  <input className="adm-input" value={editing.recipient || ""} onChange={e => set("recipient", e.target.value)} />
                </div>
              </div>
              <div className="adm-row">
                <div className="adm-col">
                  <label className="adm-label">Date text</label>
                  <input className="adm-input" value={editing.dateText || ""} onChange={e => set("dateText", e.target.value)} placeholder="e.g. December 1943" />
                </div>
                <div className="adm-col">
                  <label className="adm-label">Year</label>
                  <input className="adm-input" type="number" value={editing.yearFrom || ""} onChange={e => set("yearFrom", e.target.value)} />
                </div>
              </div>
              <div className="adm-row">
                <div className="adm-col">
                  <label className="adm-label">Archive reference</label>
                  <input className="adm-input" value={editing.archiveRef || ""} onChange={e => set("archiveRef", e.target.value)} placeholder="e.g. D3838/3/8 Acc 17015" />
                </div>
                <div className="adm-col">
                  <label className="adm-label">Source / held at</label>
                  <input className="adm-input" value={editing.source || ""} onChange={e => set("source", e.target.value)} placeholder="e.g. PRONI, JLF Archive" />
                </div>
                <div className="adm-col">
                  <label className="adm-label">Access tier</label>
                  <select className="adm-select" value={editing.accessTier || "researcher"} onChange={e => set("accessTier", e.target.value)}>
                    <option value="public">Public</option>
                    <option value="researcher">Researcher only</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="adm-card">
              <label className="adm-label">Public summary (always visible)</label>
              <textarea className="adm-textarea" style={{ minHeight: 70 }}
                value={editing.summary || ""} onChange={e => set("summary", e.target.value)}
                placeholder="2–3 sentence description visible to all users" />
            </div>

            <div className="adm-card">
              <label className="adm-label">Full text (researcher tier)</label>
              <textarea className="adm-textarea" style={{ minHeight: 300, fontFamily: "Georgia, serif", fontSize: "0.8rem", lineHeight: 1.7 }}
                value={editing.fullText || ""} onChange={e => set("fullText", e.target.value)}
                placeholder="Paste the full transcription here…" />
              <div style={{ marginTop: 8, fontSize: "0.65rem", color: "#3a5068" }}>
                {(editing.fullText || "").length.toLocaleString()} characters
                · {(editing.fullText || "").split(/\s+/).filter(Boolean).length.toLocaleString()} words
              </div>
            </div>

            {/* Existing excerpts */}
            {!isNew && selected?.excerpts?.filter(e => e.excerptId).length > 0 && (
              <div className="adm-card">
                <span className="adm-label">Tagged excerpts ({selected.excerpts.filter(e => e.excerptId).length})</span>
                {selected.excerpts.filter(e => e.excerptId).map((ex, i) => (
                  <div key={i} style={{
                    padding: "10px 0",
                    borderBottom: i < selected.excerpts.filter(e => e.excerptId).length - 1 ? "1px solid #1a2030" : "none",
                  }}>
                    <div style={{ fontSize: "0.73rem", color: "#8a9aaa", fontFamily: "Georgia, serif", fontStyle: "italic", lineHeight: 1.5, marginBottom: 6 }}>
                      "{ex.text?.slice(0, 160)}{ex.text?.length > 160 ? "…" : ""}"
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      {ex.artworkTitle && (
                        <span style={{ fontSize: "0.65rem", color: "#4a7fa5" }}>
                          → {ex.artworkTitle}
                        </span>
                      )}
                      <span className={`adm-badge adm-badge-${ex.accessTier}`}>{ex.accessTier}</span>
                      <span className={`adm-badge adm-badge-${ex.confidence}`}>{ex.confidence}</span>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 12 }}>
                  <Link
                    to={`/admin/tagger/${selected.documentId}`}
                    className="adm-btn adm-btn-secondary"
                    style={{ textDecoration: "none" }}
                  >
                    ⌗ Add more excerpts in tagger
                  </Link>
                </div>
              </div>
            )}

            {/* ── Document images (pages) ── */}
            {!isNew && (
              <div className="adm-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span className="adm-label">Document images ({images.length} page{images.length !== 1 ? "s" : ""})</span>
                  <button className="adm-btn adm-btn-secondary" style={{ fontSize: "0.72rem", padding: "4px 12px" }}
                    onClick={() => setAddingImg(v => !v)}>
                    {addingImg ? "Cancel" : "+ Add image"}
                  </button>
                </div>

                {/* Image grid */}
                {images.length > 0 && (
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                    {images.map((img, i) => (
                      <div key={i} style={{ position: "relative", width: 90, border: "1px solid #1a2030",
                        borderRadius: 4, overflow: "hidden", background: "#0d1520" }}>
                        {img.thumbnailUrl
                          ? <img src={img.thumbnailUrl} style={{ width: "100%", height: 70, objectFit: "cover", display: "block" }} alt="" />
                          : <div style={{ width: "100%", height: 70, display: "flex", alignItems: "center",
                              justifyContent: "center", color: "#3a5068", fontSize: "1.2rem" }}>◎</div>
                        }
                        <div style={{ padding: "4px 6px", fontSize: "0.62rem", color: "#6a8aaa" }}>
                          p.{img.page}{img.caption ? ` — ${img.caption.slice(0,20)}` : ""}
                        </div>
                        <button onClick={async () => {
                          await adminApi("document_image_delete", { id: img.imageId });
                          loadImages(selected.documentId);
                        }} style={{ position: "absolute", top: 3, right: 3, background: "rgba(0,0,0,0.6)",
                          border: "none", color: "#ff6060", cursor: "pointer", borderRadius: 3,
                          width: 18, height: 18, display: "flex", alignItems: "center",
                          justifyContent: "center", fontSize: "0.7rem", padding: 0 }}>×</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add image form */}
                {addingImg && (
                  <div style={{ borderTop: "1px solid #1a2030", paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <div>
                        <label className="adm-label">Page number</label>
                        <input className="adm-input" type="number" min="1" value={imgForm.page}
                          onChange={e => setImgForm(f => ({ ...f, page: e.target.value }))} placeholder="1" />
                      </div>
                      <div>
                        <label className="adm-label">Access tier</label>
                        <select className="adm-input" value={imgForm.accessTier}
                          onChange={e => setImgForm(f => ({ ...f, accessTier: e.target.value }))}>
                          <option value="researcher">Researcher</option>
                          <option value="public">Public</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="adm-label">Display image URL (S3)</label>
                      <input className="adm-input" value={imgForm.imageUrl}
                        onChange={e => setImgForm(f => ({ ...f, imageUrl: e.target.value }))}
                        placeholder="https://johnluke-assets.s3.eu-west-1.amazonaws.com/archive/display/letters/..." />
                    </div>
                    <div>
                      <label className="adm-label">Thumbnail URL (S3)</label>
                      <input className="adm-input" value={imgForm.thumbnailUrl}
                        onChange={e => setImgForm(f => ({ ...f, thumbnailUrl: e.target.value }))}
                        placeholder="https://johnluke-assets.s3.eu-west-1.amazonaws.com/archive/thumbs/letters/..." />
                    </div>
                    <div>
                      <label className="adm-label">Caption (optional)</label>
                      <input className="adm-input" value={imgForm.caption}
                        onChange={e => setImgForm(f => ({ ...f, caption: e.target.value }))}
                        placeholder="e.g. Page 1 of 3" />
                    </div>
                    <button className="adm-btn adm-btn-primary" style={{ alignSelf: "flex-end" }}
                      onClick={async () => {
                        await adminApi("document_image_add", {
                          documentId:   selected.documentId,
                          page:         parseInt(imgForm.page) || 1,
                          imageUrl:     imgForm.imageUrl,
                          thumbnailUrl: imgForm.thumbnailUrl,
                          imageSlug:    imgForm.imageSlug,
                          caption:      imgForm.caption,
                          accessTier:   imgForm.accessTier,
                        });
                        setImgForm({ page: "", imageUrl: "", thumbnailUrl: "", imageSlug: "", caption: "", accessTier: "researcher" });
                        setAddingImg(false);
                        loadImages(selected.documentId);
                      }}>
                      Add image
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Depicts artwork (photographs only) ── */}
            {!isNew && editing?.type === "photograph" && (
              <div className="adm-card">
                <span className="adm-label">Depicts artwork</span>
                <div style={{ fontSize: "0.72rem", color: "#6a8aaa", marginBottom: 10 }}>
                  Link this photograph to the artwork it shows.
                </div>

                {depictsArtwork && (
                  <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 10px",
                    background: "#0d1520", borderRadius: 4, border: "1px solid #1a2030", marginBottom: 10 }}>
                    {depictsArtwork.thumbnailUrl &&
                      <img src={depictsArtwork.thumbnailUrl} style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 3 }} alt="" />
                    }
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.8rem", color: "#c8d8e8" }}>{depictsArtwork.title}</div>
                      <div style={{ fontSize: "0.7rem", color: "#4a7fa5" }}>{depictsArtwork.artworkId}</div>
                    </div>
                    <button onClick={async () => {
                      await adminApi("document_depicts_remove", { documentId: selected.documentId });
                      setDepictsArtwork(null);
                    }} style={{ background: "none", border: "none", color: "#ff6060", cursor: "pointer", fontSize: "0.75rem" }}>
                      Remove
                    </button>
                  </div>
                )}

                <div style={{ position: "relative" }}>
                  <input className="adm-input" placeholder="Search artwork by title or ID…"
                    value={artworkSearch}
                    onChange={e => { setArtworkSearch(e.target.value); searchArtworks(e.target.value); }} />
                  {artworkResults.length > 0 && (
                    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20,
                      background: "#0a0e14", border: "1px solid #1a2030", borderRadius: 4, maxHeight: 200, overflowY: "auto" }}>
                      {artworkResults.map((aw, i) => (
                        <div key={i} onClick={async () => {
                          await adminApi("document_depicts_set", {
                            documentId: selected.documentId,
                            artworkId: aw.artworkId,
                          });
                          setDepictsArtwork(aw);
                          setArtworkSearch(""); setArtworkResults([]);
                        }} style={{ display: "flex", gap: 10, alignItems: "center",
                          padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid #1a2030" }}
                          onMouseEnter={e => e.currentTarget.style.background = "#0d1520"}
                          onMouseLeave={e => e.currentTarget.style.background = ""}>
                          {aw.thumbnailUrl && <img src={aw.thumbnailUrl} style={{ width: 32, height: 32, objectFit: "cover", borderRadius: 2 }} alt="" />}
                          <div>
                            <div style={{ fontSize: "0.78rem", color: "#c8d8e8" }}>{aw.title}</div>
                            <div style={{ fontSize: "0.65rem", color: "#4a7fa5" }}>{aw.artworkId} · {aw.dateText}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", paddingBottom: 32 }}>
              <button className="adm-btn adm-btn-primary" onClick={save} disabled={saving}>
                {saving ? "Saving…" : isNew ? "Create document" : "Save changes"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
