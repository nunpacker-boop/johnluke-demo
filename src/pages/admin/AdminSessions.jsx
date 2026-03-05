import { useState, useEffect } from "react";

// Sessions are stored in KV — we read them via a dedicated endpoint
export default function AdminSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [msg, setMsg]           = useState(null);

  useEffect(() => {
    fetch("/api/admin-sessions", { credentials: "include" })
      .then(r => r.json())
      .then(d => { setSessions(d.sessions || []); setLoading(false); })
      .catch(() => {
        setMsg({ type: "error", text: "Could not load sessions — ensure JL_SESSIONS KV is bound" });
        setLoading(false);
      });
  }, []);

  const clearSession = async (uuid) => {
    if (!confirm(`Clear session ${uuid.slice(0,8)}…?`)) return;
    try {
      await fetch("/api/admin-sessions", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uuid }),
      });
      setSessions(prev => prev.filter(s => s.uuid !== uuid));
    } catch (e) { setMsg({ type: "error", text: e.message }); }
  };

  const totalHidden = sessions.reduce((n, s) =>
    n + Object.values(s.timelineOverrides || {}).filter(v => v === false).length, 0);

  return (
    <div>
      <h1 className="adm-page-title">Visitor Sessions</h1>
      <div style={{ fontSize: "0.7rem", color: "#3a5068", marginBottom: 20 }}>
        Anonymous KV-backed sessions. Each represents one browser with active curation choices.
      </div>

      {msg && <div className={`adm-msg-${msg.type}`}>{msg.text}</div>}

      {loading ? (
        <div className="adm-empty">Loading…</div>
      ) : sessions.length === 0 ? (
        <div className="adm-empty">No active sessions</div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Active sessions", value: sessions.length },
              { label: "Total hidden artworks", value: totalHidden },
              { label: "Sessions with overrides", value: sessions.filter(s => Object.keys(s.timelineOverrides || {}).length > 0).length },
            ].map(t => (
              <div key={t.label} className="adm-card">
                <div style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: "1.6rem", fontWeight: 600, color: "#4a7fa5" }}>{t.value}</div>
                <div style={{ fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#3a5068", marginTop: 4 }}>{t.label}</div>
              </div>
            ))}
          </div>

          <table className="adm-table">
            <thead>
              <tr>
                <th>Session ID</th>
                <th>Created</th>
                <th>Updated</th>
                <th>Hidden</th>
                <th>Annotations</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => (
                <tr key={s.uuid}>
                  <td style={{ fontFamily: "monospace", fontSize: "0.65rem", color: "#4a6070" }}>
                    {s.uuid?.slice(0, 12)}…
                  </td>
                  <td style={{ fontSize: "0.68rem" }}>{s.createdAt ? new Date(s.createdAt).toLocaleDateString("en-GB") : "—"}</td>
                  <td style={{ fontSize: "0.68rem" }}>{s.updatedAt ? new Date(s.updatedAt).toLocaleDateString("en-GB") : "—"}</td>
                  <td>
                    {Object.values(s.timelineOverrides || {}).filter(v => v === false).length || "—"}
                  </td>
                  <td>{Object.keys(s.annotations || {}).length || "—"}</td>
                  <td>
                    <button className="adm-btn adm-btn-danger" style={{ padding: "3px 8px" }}
                      onClick={() => clearSession(s.uuid)}>
                      Clear
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
