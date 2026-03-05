// AdminTimeline.jsx — bulk timeline visibility management
import { useState, useEffect } from "react";
import { adminApi } from "./AdminShell.jsx";
import { Toggle } from "./AdminShell.jsx";

export default function AdminTimeline() {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [saving, setSaving]     = useState({});
  const [msg, setMsg]           = useState(null);

  const load = async (q = "") => {
    setLoading(true);
    try {
      const d = await adminApi("artworks_list", { search: q, limit: 250 });
      setArtworks(d.artworks);
    } catch (e) { setMsg({ type: "error", text: e.message }); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggle = async (artworkId, value) => {
    setSaving(prev => ({ ...prev, [artworkId]: true }));
    try {
      await adminApi("artwork_update", { id: artworkId, fields: { timelineVisible: value } });
      setArtworks(prev => prev.map(a => a.artworkId === artworkId ? { ...a, timelineVisible: value } : a));
    } catch (e) { setMsg({ type: "error", text: e.message }); }
    setSaving(prev => ({ ...prev, [artworkId]: false }));
  };

  const filtered = artworks.filter(a =>
    !search || a.title?.toLowerCase().includes(search.toLowerCase())
  );

  const hiddenCount = artworks.filter(a => a.timelineVisible === false).length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 className="adm-page-title" style={{ marginBottom: 4 }}>Timeline Visibility</h1>
          <div style={{ fontSize: "0.7rem", color: "#3a5068" }}>
            {hiddenCount} of {artworks.length} artworks hidden globally ·
            Session overrides by visitors are separate and do not appear here
          </div>
        </div>
      </div>

      {msg && <div className={`adm-msg-${msg.type}`}>{msg.text}</div>}

      <div style={{ marginBottom: 16 }}>
        <input className="adm-input" style={{ maxWidth: 320 }}
          placeholder="Filter by title…" value={search}
          onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="adm-empty">Loading…</div>
      ) : (
        <table className="adm-table">
          <thead>
            <tr>
              <th style={{ width: 48 }}></th>
              <th>Title</th>
              <th>Year</th>
              <th>Medium</th>
              <th>Theme</th>
              <th>Selected</th>
              <th>Timeline</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => (
              <tr key={a.artworkId} style={{ opacity: a.timelineVisible === false ? 0.5 : 1 }}>
                <td>
                  {a.thumbnailUrl
                    ? <img src={a.thumbnailUrl} style={{ width: 28, height: 28, objectFit: "cover", borderRadius: 2 }} alt="" />
                    : <div style={{ width: 28, height: 28, background: "#1a2030", borderRadius: 2 }} />}
                </td>
                <td style={{ color: "#9aaab8" }}>
                  <a href={`/works/${a.artworkId}`} target="_blank"
                    style={{ color: "inherit", textDecoration: "none" }}>
                    {a.title || "Untitled"}
                  </a>
                </td>
                <td>{a.yearFrom || "—"}</td>
                <td style={{ fontSize: "0.68rem" }}>{a.medium || "—"}</td>
                <td style={{ fontSize: "0.68rem" }}>{a.theme || "—"}</td>
                <td>
                  {a.selectedCatalogue
                    ? <span className="adm-badge adm-badge-certain">Yes</span>
                    : <span style={{ color: "#2a3a4a", fontSize: "0.65rem" }}>No</span>}
                </td>
                <td>
                  <Toggle
                    checked={a.timelineVisible !== false}
                    onChange={v => toggle(a.artworkId, v)}
                    label={saving[a.artworkId] ? "…" : undefined}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
