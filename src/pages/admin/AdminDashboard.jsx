import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "./AdminShell.jsx";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    adminApi("stats")
      .then(d => { setStats(d.stats); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const tiles = stats ? [
    { label: "Artworks",     value: stats.artworks,     path: "/admin/artworks",    icon: "⬚", color: "#4a7fa5" },
    { label: "Documents",    value: stats.documents,    path: "/admin/documents",   icon: "≡",  color: "#5a9070" },
    { label: "Excerpts",     value: stats.excerpts,     path: "/admin/tagger",      icon: "⌗",  color: "#9a7040" },
    { label: "Commissions",  value: stats.commissions,  path: "/admin/commissions", icon: "⊙",  color: "#7a5090" },
  ] : [];

  const alerts = stats ? [
    stats.missingMedium > 0 && { label: `${stats.missingMedium} artworks missing medium`, path: "/admin/artworks" },
    stats.missingTheme  > 0 && { label: `${stats.missingTheme} artworks missing theme`,  path: "/admin/artworks" },
    stats.documents === 0   && { label: "No documents entered yet — start in Documents",  path: "/admin/documents" },
  ].filter(Boolean) : [];

  return (
    <div>
      <h1 className="adm-page-title">Dashboard</h1>

      {error && <div className="adm-msg-error">{error}</div>}

      {loading ? (
        <div className="adm-empty">Loading…</div>
      ) : (
        <>
          {/* Stat tiles */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
            {tiles.map(t => (
              <Link key={t.label} to={t.path} style={{ textDecoration: "none" }}>
                <div className="adm-card" style={{
                  borderColor: t.color + "30",
                  cursor: "pointer", transition: "border-color 0.15s",
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = t.color + "60"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = t.color + "30"}
                >
                  <div style={{ fontSize: "1.4rem", marginBottom: 8, color: t.color }}>{t.icon}</div>
                  <div style={{
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: "1.8rem", fontWeight: 600,
                    color: t.color, lineHeight: 1,
                  }}>{t.value ?? "—"}</div>
                  <div style={{
                    fontSize: "0.65rem", letterSpacing: "0.12em",
                    textTransform: "uppercase", color: "#3a5068",
                    marginTop: 6, fontWeight: 600,
                  }}>{t.label}</div>
                </div>
              </Link>
            ))}
          </div>

          {/* Alerts */}
          {alerts.length > 0 && (
            <div className="adm-card" style={{ borderColor: "#4a3020" }}>
              <span className="adm-label">Attention needed</span>
              {alerts.map((a, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 0",
                  borderBottom: i < alerts.length - 1 ? "1px solid #1a2030" : "none",
                }}>
                  <span style={{ color: "#906040", fontSize: "0.7rem" }}>▲</span>
                  <Link to={a.path} style={{
                    color: "#8a7060", fontSize: "0.75rem",
                    textDecoration: "none", letterSpacing: "0.04em",
                  }}>
                    {a.label}
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Quick actions */}
          <div className="adm-card" style={{ marginTop: 8 }}>
            <span className="adm-label">Quick actions</span>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
              <Link to="/admin/documents" className="adm-btn adm-btn-secondary"
                style={{ textDecoration: "none" }}>
                + New document
              </Link>
              <Link to="/admin/tagger" className="adm-btn adm-btn-secondary"
                style={{ textDecoration: "none" }}>
                Open tagger
              </Link>
              <Link to="/admin/commissions" className="adm-btn adm-btn-secondary"
                style={{ textDecoration: "none" }}>
                + New commission
              </Link>
              <a href="/works/selected-catalogue" target="_blank"
                className="adm-btn adm-btn-secondary"
                style={{ textDecoration: "none" }}>
                ↗ View timeline
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
