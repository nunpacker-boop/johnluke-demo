// AdminCommissions.jsx
import { useState, useEffect } from "react";
import { adminApi } from "./AdminShell.jsx";

const EMPTY = {
  commissioner: "", dateText: "", yearFrom: "",
  type: "verbal", fee: "", currency: "GBP",
  purpose: "", notes: "", artworkId: "",
};

export function AdminCommissions() {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [form, setForm]               = useState(null);
  const [artworkSearch, setArtworkSearch] = useState("");
  const [artworkResults, setArtworkResults] = useState([]);
  const [saving, setSaving]           = useState(false);
  const [msg, setMsg]                 = useState(null);

  const load = async () => {
    setLoading(true);
    try { const d = await adminApi("commissions_list"); setCommissions(d.commissions); }
    catch (e) { setMsg({ type: "error", text: e.message }); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!artworkSearch.trim()) { setArtworkResults([]); return; }
    const t = setTimeout(() => {
      adminApi("artworks_search", { q: artworkSearch }).then(d => setArtworkResults(d.artworks)).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [artworkSearch]);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const save = async () => {
    setSaving(true); setMsg(null);
    try {
      await adminApi("commission_create", { ...form, yearFrom: parseInt(form.yearFrom) || null });
      setMsg({ type: "success", text: "Commission saved" });
      setForm(null);
      await load();
    } catch (e) { setMsg({ type: "error", text: e.message }); }
    setSaving(false);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 className="adm-page-title" style={{ margin: 0 }}>Commissions</h1>
        <button className="adm-btn adm-btn-primary" onClick={() => setForm({ ...EMPTY })}>+ New</button>
      </div>

      {msg && <div className={`adm-msg-${msg.type}`}>{msg.text}</div>}

      {form && (
        <div className="adm-card" style={{ marginBottom: 24, borderColor: "#2a4060" }}>
          <span className="adm-label">New commission record</span>
          <div className="adm-row">
            <div className="adm-col">
              <label className="adm-label">Commissioner</label>
              <input className="adm-input" value={form.commissioner} onChange={e => set("commissioner", e.target.value)} placeholder="e.g. Captain Terriss, John Hewitt, Belfast Museum" />
            </div>
            <div className="adm-col">
              <label className="adm-label">Type</label>
              <select className="adm-select" value={form.type} onChange={e => set("type", e.target.value)}>
                <option value="verbal">Verbal</option>
                <option value="formal">Formal (documented)</option>
              </select>
            </div>
          </div>
          <div className="adm-row">
            <div className="adm-col">
              <label className="adm-label">Date</label>
              <input className="adm-input" value={form.dateText} onChange={e => set("dateText", e.target.value)} placeholder="e.g. November 1948" />
            </div>
            <div className="adm-col">
              <label className="adm-label">Year</label>
              <input className="adm-input" type="number" value={form.yearFrom} onChange={e => set("yearFrom", e.target.value)} />
            </div>
            <div className="adm-col">
              <label className="adm-label">Fee</label>
              <input className="adm-input" value={form.fee} onChange={e => set("fee", e.target.value)} placeholder="e.g. 250" />
            </div>
            <div className="adm-col">
              <label className="adm-label">Currency</label>
              <select className="adm-select" value={form.currency} onChange={e => set("currency", e.target.value)}>
                <option>GBP</option><option>IEP</option><option>USD</option>
              </select>
            </div>
          </div>

          {/* Artwork link */}
          <div style={{ marginBottom: 12 }}>
            <label className="adm-label">Linked artwork</label>
            <div style={{ position: "relative" }}>
              <input className="adm-input" placeholder="Search artwork…"
                value={artworkSearch}
                onChange={e => { setArtworkSearch(e.target.value); if (!e.target.value) set("artworkId",""); }} />
              {artworkResults.length > 0 && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100,
                  background: "#0d1218", border: "1px solid #1e2a38", borderRadius: 4, maxHeight: 180, overflowY: "auto" }}>
                  {artworkResults.map(a => (
                    <div key={a.artworkId} onClick={() => { set("artworkId", a.artworkId); setArtworkSearch(a.title); setArtworkResults([]); }}
                      style={{ padding: "7px 10px", cursor: "pointer", fontSize: "0.72rem", color: "#9aaab8" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#131e2a"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      {a.title} <span style={{ color: "#3a5068" }}>({a.yearFrom || "—"})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label className="adm-label">Purpose / description</label>
            <textarea className="adm-textarea" style={{ minHeight: 60 }} value={form.purpose} onChange={e => set("purpose", e.target.value)} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="adm-label">Notes (internal)</label>
            <textarea className="adm-textarea" style={{ minHeight: 50 }} value={form.notes} onChange={e => set("notes", e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="adm-btn adm-btn-primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
            <button className="adm-btn adm-btn-secondary" onClick={() => setForm(null)}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="adm-empty">Loading…</div>
      ) : commissions.length === 0 ? (
        <div className="adm-empty">No commissions yet</div>
      ) : (
        <table className="adm-table">
          <thead>
            <tr>
              <th>Artwork</th>
              <th>Commissioner</th>
              <th>Date</th>
              <th>Type</th>
              <th>Fee</th>
            </tr>
          </thead>
          <tbody>
            {commissions.map(c => (
              <tr key={c.commissionId}>
                <td style={{ color: "#7ab3d4" }}>
                  {c.artworkTitle
                    ? <a href={`/works/${c.artworkId}`} target="_blank" style={{ color: "inherit" }}>{c.artworkTitle}</a>
                    : <span style={{ color: "#3a5068" }}>—</span>}
                </td>
                <td>{c.commissioner || "—"}</td>
                <td>{c.dateText || c.yearFrom || "—"}</td>
                <td><span className={`adm-badge ${c.type === "formal" ? "adm-badge-certain" : "adm-badge-possible"}`}>{c.type}</span></td>
                <td>{c.fee ? `${c.currency} ${c.fee}` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminCommissions;
