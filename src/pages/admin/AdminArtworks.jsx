import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { adminApi } from "./AdminShell.jsx";
import { Toggle } from "./AdminShell.jsx";

const THEMES   = ["Landscape","Figure","Portrait","Still Life","Animal","Religious","Cityscape","Decorative"];
const MEDIUMS  = ["Oil","Oil and Tempera","Tempera","Watercolour","Gouache","Pastel","Pencil","Coloured Pencil","Conté","Charcoal","Charcoal and Watercolour Wash","Pen and Ink with Wash","Linocut","Woodcut","Encaustic (Oil and Wax)","Distemper","Sculpture","Mixed Media","Unknown"];
const SUPPORTS = ["Canvas","Canvas on board","Cotton on board","Linen on board","Board","Panel","Thick card","Paper","Rice paper","Stone","Unknown"];

export default function AdminArtworks() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [artworks, setArtworks]   = useState([]);
  const [total, setTotal]         = useState(0);
  const [search, setSearch]       = useState("");
  const [loading, setLoading]     = useState(false);
  const [selected, setSelected]   = useState(null);
  const [editing, setEditing]     = useState({});
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState(null);

  const load = useCallback(async (q = search) => {
    setLoading(true);
    try {
      const d = await adminApi("artworks_list", { search: q, limit: 100 });
      setArtworks(d.artworks);
      setTotal(d.total);
    } catch (e) { setMsg({ type: "error", text: e.message }); }
    setLoading(false);
  }, [search]);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (id && artworks.length) {
      const found = artworks.find(a => a.artworkId === id);
      if (found) openArtwork(found.artworkId);
    }
  }, [id, artworks]);

  const openArtwork = async (artworkId) => {
    try {
      const d = await adminApi("artwork_get", { id: artworkId });
      setSelected(d.artwork);
      setEditing({ ...d.artwork });
      setArtImages([]);
      setImgMsg(null);
      navigate(`/admin/artworks/${artworkId}`, { replace: true });
      loadArtImages(artworkId);
    } catch (e) { setMsg({ type: "error", text: e.message }); }
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    setMsg(null);
    try {
      const fields = {};
      const EDITABLE = ["title","dateText","yearFrom","yearTo","dateUncertain",
        "medium","support","mediumNotes","theme","description","notes",
        "dimensionsText","heightCm","widthCm","currentLocation",
        "selectedCatalogue","isStudy","timelineVisible","signature","condition"];
      EDITABLE.forEach(k => { if (editing[k] !== undefined) fields[k] = editing[k]; });
      await adminApi("artwork_update", { id: selected.artworkId, fields });
      setMsg({ type: "success", text: "Saved" });
      // Refresh list row
      setArtworks(prev => prev.map(a =>
        a.artworkId === selected.artworkId ? { ...a, ...fields } : a
      ));
    } catch (e) { setMsg({ type: "error", text: e.message }); }
    setSaving(false);
  };

  const set = (k, v) => setEditing(prev => ({ ...prev, [k]: v }));

  // ── Artwork images ────────────────────────────────────────────────────────
  const [artImages, setArtImages]     = useState([]);
  const [newImg, setNewImg]           = useState({ imageUrl: "", thumbnailUrl: "", caption: "", sortOrder: 2 });
  const [imgAdding, setImgAdding]     = useState(false);
  const [imgMsg, setImgMsg]           = useState(null);

  const loadArtImages = async (artworkId) => {
    try {
      const d = await adminApi("artwork_image_list", { id: artworkId });
      setArtImages(d.images || []);
    } catch (e) { setArtImages([]); }
  };

  const addArtImage = async () => {
    if (!newImg.imageUrl.trim()) return;
    setImgAdding(true); setImgMsg(null);
    try {
      await adminApi("artwork_image_add", { id: selected.artworkId, ...newImg });
      setNewImg({ imageUrl: "", thumbnailUrl: "", caption: "", sortOrder: 2 });
      await loadArtImages(selected.artworkId);
      setImgMsg({ type: "success", text: "Image added" });
    } catch (e) { setImgMsg({ type: "error", text: e.message }); }
    setImgAdding(false);
  };

  const deleteArtImage = async (imageId) => {
    if (!confirm("Remove this image?")) return;
    try {
      await adminApi("artwork_image_delete", { id: selected.artworkId, imageId });
      await loadArtImages(selected.artworkId);
    } catch (e) { setImgMsg({ type: "error", text: e.message }); }
  };

  const searchTimeout = useCallback((() => {
    let t;
    return (q) => { clearTimeout(t); t = setTimeout(() => load(q), 350); };
  })(), [load]);

  return (
    <div style={{ display: "flex", gap: 24, height: "calc(100vh - 104px)" }}>

      {/* List pane */}
      <div style={{ width: 340, minWidth: 340, display: "flex", flexDirection: "column" }}>
        <h1 className="adm-page-title" style={{ marginBottom: 16 }}>
          Artworks <span style={{ color: "#3a5068", fontSize: "0.75rem" }}>{total}</span>
        </h1>
        <input
          className="adm-input adm-search-input"
          placeholder="Search by title or ID (e.g. jl-016)…"
          value={search}
          onChange={e => { setSearch(e.target.value); searchTimeout(e.target.value); }}
          style={{ marginBottom: 12 }}
        />
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div className="adm-empty">Loading…</div>
          ) : artworks.length === 0 ? (
            <div className="adm-empty">No artworks found</div>
          ) : artworks.map(a => (
            <div
              key={a.artworkId}
              onClick={() => openArtwork(a.artworkId)}
              style={{
                display: "flex", gap: 10, padding: "9px 10px",
                cursor: "pointer", borderRadius: 4,
                background: selected?.artworkId === a.artworkId ? "#0d1826" : "transparent",
                borderLeft: selected?.artworkId === a.artworkId ? "2px solid #4a7fa5" : "2px solid transparent",
                marginBottom: 2,
              }}
            >
              {a.thumbnailUrl
                ? <img src={a.thumbnailUrl} className="adm-thumb" alt="" />
                : <div className="adm-thumb" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#2a3a4a", fontSize: "0.7rem" }}>⬚</div>
              }
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontSize: "0.75rem", color: "#9aaab8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {a.title || "Untitled"}
                </div>
                <div style={{ fontSize: "0.65rem", color: "#3a5068", marginTop: 2 }}>
                  {a.yearFrom || "Undated"} · {a.medium || "—"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit pane */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {!selected ? (
          <div className="adm-empty" style={{ marginTop: 80 }}>
            Select an artwork to edit
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: "1rem", color: "#c8cdd6", margin: 0 }}>
                  {selected.title || "Untitled"}
                </h2>
                <div style={{ fontSize: "0.65rem", color: "#3a5068", marginTop: 4, letterSpacing: "0.08em" }}>
                  {selected.artworkId?.replace("artwork-","")?.toUpperCase()}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <a href={`/works/${selected.artworkId}`} target="_blank"
                  className="adm-btn adm-btn-secondary" style={{ textDecoration: "none" }}>
                  ↗ View
                </a>
                <button className="adm-btn adm-btn-primary" onClick={save} disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>

            {msg && <div className={`adm-msg-${msg.type}`}>{msg.text}</div>}

            {/* Image */}
            {editing.imageUrl && (
              <div style={{ marginBottom: 20 }}>
                <img src={editing.thumbnailUrl || editing.imageUrl} alt=""
                  style={{ height: 120, objectFit: "contain", borderRadius: 4, background: "#1a2030" }} />
              </div>
            )}

            {/* Core fields */}
            <div className="adm-card">
              <span className="adm-label">Identity</span>
              <div className="adm-row">
                <div className="adm-col-2">
                  <label className="adm-label">Title</label>
                  <input className="adm-input" value={editing.title || ""} onChange={e => set("title", e.target.value)} />
                </div>
                <div className="adm-col">
                  <label className="adm-label">Date text</label>
                  <input className="adm-input" value={editing.dateText || ""} onChange={e => set("dateText", e.target.value)} />
                </div>
              </div>
              <div className="adm-row">
                <div className="adm-col">
                  <label className="adm-label">Year from</label>
                  <input className="adm-input" type="number" value={editing.yearFrom || ""} onChange={e => set("yearFrom", parseInt(e.target.value) || null)} />
                </div>
                <div className="adm-col">
                  <label className="adm-label">Year to</label>
                  <input className="adm-input" type="number" value={editing.yearTo || ""} onChange={e => set("yearTo", parseInt(e.target.value) || null)} />
                </div>
                <div className="adm-col" style={{ paddingTop: 20 }}>
                  <Toggle checked={!!editing.dateUncertain} onChange={v => set("dateUncertain", v)} label="Date uncertain" />
                </div>
              </div>
            </div>

            {/* Medium & support */}
            <div className="adm-card">
              <span className="adm-label">Medium & Support</span>
              <div className="adm-row">
                <div className="adm-col">
                  <label className="adm-label">Medium</label>
                  <select className="adm-select" value={editing.medium || ""} onChange={e => set("medium", e.target.value)}>
                    <option value="">— select —</option>
                    {MEDIUMS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="adm-col">
                  <label className="adm-label">Support</label>
                  <select className="adm-select" value={editing.support || ""} onChange={e => set("support", e.target.value)}>
                    <option value="">— select —</option>
                    {SUPPORTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="adm-col">
                  <label className="adm-label">Theme</label>
                  <select className="adm-select" value={editing.theme || ""} onChange={e => set("theme", e.target.value)}>
                    <option value="">— select —</option>
                    {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="adm-label">Medium notes</label>
                <input className="adm-input" value={editing.mediumNotes || ""} onChange={e => set("mediumNotes", e.target.value)} />
              </div>
            </div>

            {/* Physical */}
            <div className="adm-card">
              <span className="adm-label">Physical</span>
              <div className="adm-row">
                <div className="adm-col">
                  <label className="adm-label">Dimensions text</label>
                  <input className="adm-input" value={editing.dimensionsText || ""} onChange={e => set("dimensionsText", e.target.value)} />
                </div>
                <div className="adm-col">
                  <label className="adm-label">Height (cm)</label>
                  <input className="adm-input" type="number" step="0.1" value={editing.heightCm || ""} onChange={e => set("heightCm", parseFloat(e.target.value) || null)} />
                </div>
                <div className="adm-col">
                  <label className="adm-label">Width (cm)</label>
                  <input className="adm-input" type="number" step="0.1" value={editing.widthCm || ""} onChange={e => set("widthCm", parseFloat(e.target.value) || null)} />
                </div>
              </div>
              <div className="adm-row">
                <div className="adm-col">
                  <label className="adm-label">Current location</label>
                  <input className="adm-input" value={editing.currentLocation || ""} onChange={e => set("currentLocation", e.target.value)} />
                </div>
                <div className="adm-col">
                  <label className="adm-label">Signature</label>
                  <input className="adm-input" value={editing.signature || ""} onChange={e => set("signature", e.target.value)} />
                </div>
              </div>
            </div>

            {/* Flags */}
            <div className="adm-card">
              <span className="adm-label">Catalogue flags</span>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginTop: 8 }}>
                <Toggle checked={!!editing.selectedCatalogue} onChange={v => set("selectedCatalogue", v)} label="Selected catalogue" />
                <Toggle checked={!!editing.isStudy} onChange={v => set("isStudy", v)} label="Is study" />
                <Toggle checked={editing.timelineVisible !== false} onChange={v => set("timelineVisible", v)} label="Timeline visible" />
              </div>
            </div>

            {/* Description / notes */}
            <div className="adm-card">
              <span className="adm-label">Description</span>
              <textarea className="adm-textarea" style={{ minHeight: 100 }}
                value={editing.description || ""} onChange={e => set("description", e.target.value)} />
              <div style={{ marginTop: 12 }}>
                <label className="adm-label">Curator notes (internal)</label>
                <textarea className="adm-textarea"
                  value={editing.notes || ""} onChange={e => set("notes", e.target.value)} />
              </div>
            </div>

            {/* Supplementary images */}
            <div className="adm-card">
              <span className="adm-label">Supplementary images</span>
              <div style={{ fontSize: "0.72rem", color: "#5a7a98", marginBottom: 12 }}>
                These appear as a clickable thumbnail strip below the primary image on the fact sheet.
                The primary image is set via <code style={{ color: "#7aaac8" }}>imageUrl</code> on the artwork node.
              </div>

              {imgMsg && <div className={`adm-msg-${imgMsg.type}`} style={{ marginBottom: 8 }}>{imgMsg.text}</div>}

              {artImages.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                  {artImages.map(img => (
                    <div key={img.imageId} style={{ position: "relative", width: 80 }}>
                      {img.thumbnailUrl || img.imageUrl
                        ? <img src={img.thumbnailUrl || img.imageUrl} alt={img.caption || ""}
                            style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 4, background: "#1a2030", display: "block" }} />
                        : <div style={{ width: 80, height: 80, background: "#1a2030", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", color: "#3a5068" }}>⬚</div>
                      }
                      {img.caption && (
                        <div style={{ fontSize: "0.6rem", color: "#5a7a98", marginTop: 3, textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {img.caption}
                        </div>
                      )}
                      <button
                        onClick={() => deleteArtImage(img.imageId)}
                        style={{ position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,0.7)", border: "none", color: "#e05050", borderRadius: 3, cursor: "pointer", fontSize: "0.65rem", padding: "1px 4px", lineHeight: 1.4 }}
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}

              {artImages.length === 0 && (
                <div style={{ fontSize: "0.72rem", color: "#3a5068", marginBottom: 12 }}>No supplementary images yet.</div>
              )}

              <div style={{ borderTop: "1px solid #1a2535", paddingTop: 12 }}>
                <div style={{ fontSize: "0.7rem", color: "#7a9ab8", marginBottom: 8, fontWeight: 600 }}>Add image</div>
                <div className="adm-row" style={{ marginBottom: 8 }}>
                  <div className="adm-col-2">
                    <label className="adm-label">Display URL <span style={{ color: "#e05050" }}>*</span></label>
                    <input className="adm-input" placeholder="https://…/artworks/display/…-display.jpg"
                      value={newImg.imageUrl}
                      onChange={e => setNewImg(p => ({ ...p, imageUrl: e.target.value }))} />
                  </div>
                </div>
                <div className="adm-row" style={{ marginBottom: 8 }}>
                  <div className="adm-col-2">
                    <label className="adm-label">Thumbnail URL</label>
                    <input className="adm-input" placeholder="https://…/artworks/thumbs/…-thumb.jpg"
                      value={newImg.thumbnailUrl}
                      onChange={e => setNewImg(p => ({ ...p, thumbnailUrl: e.target.value }))} />
                  </div>
                </div>
                <div className="adm-row">
                  <div className="adm-col">
                    <label className="adm-label">Caption</label>
                    <input className="adm-input" placeholder="e.g. verso, framed, detail"
                      value={newImg.caption}
                      onChange={e => setNewImg(p => ({ ...p, caption: e.target.value }))} />
                  </div>
                  <div className="adm-col">
                    <label className="adm-label">Sort order</label>
                    <input className="adm-input" type="number" min={1} value={newImg.sortOrder}
                      onChange={e => setNewImg(p => ({ ...p, sortOrder: parseInt(e.target.value) || 2 }))} />
                  </div>
                  <div className="adm-col" style={{ display: "flex", alignItems: "flex-end" }}>
                    <button className="adm-btn adm-btn-primary" onClick={addArtImage} disabled={imgAdding || !newImg.imageUrl.trim()}>
                      {imgAdding ? "Adding…" : "Add image"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingBottom: 32 }}>
              <button className="adm-btn adm-btn-secondary" onClick={() => setEditing({ ...selected })}>
                Reset
              </button>
              <button className="adm-btn adm-btn-primary" onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
