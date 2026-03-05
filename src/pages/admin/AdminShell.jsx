import { useState, useEffect, useCallback } from "react";
import { Routes, Route, NavLink, useNavigate, Navigate } from "react-router-dom";

// ── Sections ──────────────────────────────────────────────────────────────────
import AdminDashboard   from "./AdminDashboard.jsx";
import AdminArtworks    from "./AdminArtworks.jsx";
import AdminDocuments   from "./AdminDocuments.jsx";
import AdminTagger      from "./AdminTagger.jsx";
import AdminCommissions from "./AdminCommissions.jsx";
import AdminTimeline    from "./AdminTimeline.jsx";
import AdminSessions    from "./AdminSessions.jsx";

// ── API helper ────────────────────────────────────────────────────────────────
export async function adminApi(action, params = {}) {
  const res = await fetch("/api/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, params }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

// ── Nav items ─────────────────────────────────────────────────────────────────
const NAV = [
  { path: "",            label: "Dashboard",   icon: "◈" },
  { path: "artworks",    label: "Artworks",    icon: "⬚" },
  { path: "documents",   label: "Documents",   icon: "≡" },
  { path: "tagger",      label: "Tagger",      icon: "⌗" },
  { path: "commissions", label: "Commissions", icon: "⊙" },
  { path: "timeline",    label: "Timeline",    icon: "—" },
  { path: "sessions",    label: "Sessions",    icon: "◎" },
];

// ── Shell ─────────────────────────────────────────────────────────────────────
export default function AdminShell() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div style={{
      display: "flex", height: "100vh", overflow: "hidden",
      fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
      background: "#0a0e14", color: "#c8cdd6",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap');

        * { box-sizing: border-box; }

        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0a0e14; }
        ::-webkit-scrollbar-thumb { background: #2a3040; border-radius: 3px; }

        .adm-sidebar {
          width: 220px; min-width: 220px;
          background: #080b10;
          border-right: 1px solid #1a2030;
          display: flex; flex-direction: column;
          transition: width 0.2s;
          overflow: hidden;
        }
        .adm-sidebar.collapsed { width: 52px; min-width: 52px; }

        .adm-logo {
          padding: 20px 16px 16px;
          border-bottom: 1px solid #1a2030;
          white-space: nowrap; overflow: hidden;
        }
        .adm-logo-mark {
          font-family: 'IBM Plex Sans', sans-serif;
          font-size: 0.7rem; font-weight: 600;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: #4a7fa5; display: block;
        }
        .adm-logo-sub {
          font-size: 0.6rem; color: #3a4a5a;
          letter-spacing: 0.12em; text-transform: uppercase;
          margin-top: 3px;
        }

        .adm-nav { flex: 1; padding: 12px 0; overflow-y: auto; }

        .adm-nav-link {
          display: flex; align-items: center; gap: 12px;
          padding: 9px 16px;
          color: #5a6878; text-decoration: none;
          font-size: 0.72rem; letter-spacing: 0.08em;
          text-transform: uppercase; font-weight: 500;
          transition: all 0.15s; white-space: nowrap;
          border-left: 2px solid transparent;
        }
        .adm-nav-link:hover { color: #8a9aaa; background: #0f1520; }
        .adm-nav-link.active {
          color: #7ab3d4; background: #0d1826;
          border-left-color: #4a7fa5;
        }
        .adm-nav-icon { font-size: 0.9rem; min-width: 20px; text-align: center; }

        .adm-main {
          flex: 1; display: flex; flex-direction: column;
          overflow: hidden; background: #0a0e14;
        }

        .adm-topbar {
          height: 48px; min-height: 48px;
          border-bottom: 1px solid #1a2030;
          display: flex; align-items: center;
          padding: 0 24px; gap: 16px;
        }
        .adm-topbar-title {
          font-size: 0.72rem; letter-spacing: 0.14em;
          text-transform: uppercase; color: #3a4a5a;
        }
        .adm-topbar-site {
          margin-left: auto;
          font-size: 0.65rem; color: #3a4a5a;
          text-decoration: none; letter-spacing: 0.08em;
        }
        .adm-topbar-site:hover { color: #7ab3d4; }

        .adm-content {
          flex: 1; overflow-y: auto; padding: 28px 32px;
        }

        /* ── Shared component styles ── */
        .adm-page-title {
          font-family: 'IBM Plex Sans', sans-serif;
          font-size: 1.1rem; font-weight: 600;
          color: #c8cdd6; margin: 0 0 24px;
          letter-spacing: 0.02em;
        }

        .adm-card {
          background: #0d1218; border: 1px solid #1a2030;
          border-radius: 6px; padding: 20px;
          margin-bottom: 16px;
        }

        .adm-label {
          font-size: 0.62rem; letter-spacing: 0.14em;
          text-transform: uppercase; color: #3a5068;
          margin-bottom: 5px; display: block;
          font-weight: 600;
        }

        .adm-input, .adm-select, .adm-textarea {
          width: 100%; background: #060a0f;
          border: 1px solid #1e2a38; border-radius: 4px;
          color: #b0bac8; padding: 8px 10px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.78rem; transition: border-color 0.15s;
          outline: none;
        }
        .adm-input:focus, .adm-select:focus, .adm-textarea:focus {
          border-color: #4a7fa5;
        }
        .adm-textarea { resize: vertical; min-height: 80px; line-height: 1.5; }
        .adm-select option { background: #0d1218; }

        .adm-btn {
          padding: 7px 16px; border-radius: 4px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.7rem; font-weight: 600;
          letter-spacing: 0.08em; text-transform: uppercase;
          cursor: pointer; transition: all 0.15s; border: none;
        }
        .adm-btn-primary {
          background: #1e4060; color: #7ab3d4;
          border: 1px solid #2a5878;
        }
        .adm-btn-primary:hover { background: #264e78; color: #9bcce4; }
        .adm-btn-secondary {
          background: transparent; color: #5a6878;
          border: 1px solid #1e2a38;
        }
        .adm-btn-secondary:hover { color: #8a9aaa; border-color: #2e3a4a; }
        .adm-btn-danger {
          background: transparent; color: #885060;
          border: 1px solid #4a2830;
        }
        .adm-btn-danger:hover { background: #2a1018; color: #cc7080; }
        .adm-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .adm-row { display: flex; gap: 16px; margin-bottom: 14px; }
        .adm-col { flex: 1; }
        .adm-col-2 { flex: 2; }

        .adm-table {
          width: 100%; border-collapse: collapse;
          font-size: 0.75rem;
        }
        .adm-table th {
          text-align: left; padding: 8px 12px;
          font-size: 0.62rem; letter-spacing: 0.12em;
          text-transform: uppercase; color: #3a5068;
          border-bottom: 1px solid #1a2030; font-weight: 600;
        }
        .adm-table td {
          padding: 9px 12px; border-bottom: 1px solid #111820;
          color: #8a9aaa; vertical-align: middle;
        }
        .adm-table tr:hover td { background: #0d1520; color: #b0bac8; }
        .adm-table tr.selected td { background: #0d1826; color: #c0d0e0; }

        .adm-badge {
          display: inline-block; padding: 2px 8px;
          border-radius: 10px; font-size: 0.62rem;
          letter-spacing: 0.08em; text-transform: uppercase;
          font-weight: 600;
        }
        .adm-badge-public { background: #1a3020; color: #4a9060; }
        .adm-badge-researcher { background: #1a2840; color: #4a70a0; }
        .adm-badge-certain { background: #1a2a1a; color: #4a8060; }
        .adm-badge-probable { background: #2a2810; color: #908040; }
        .adm-badge-possible { background: #2a1a1a; color: #906050; }

        .adm-search {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 20px;
        }
        .adm-search-input {
          flex: 1; max-width: 360px;
        }

        .adm-msg-success {
          padding: 10px 14px; background: #0d2018;
          border: 1px solid #1a4028; border-radius: 4px;
          color: #4a9060; font-size: 0.75rem; margin-bottom: 16px;
        }
        .adm-msg-error {
          padding: 10px 14px; background: #201010;
          border: 1px solid #402020; border-radius: 4px;
          color: #c06060; font-size: 0.75rem; margin-bottom: 16px;
        }

        .adm-divider {
          border: none; border-top: 1px solid #1a2030;
          margin: 20px 0;
        }

        .adm-thumb {
          width: 36px; height: 36px; object-fit: cover;
          border-radius: 3px; background: #1a2030;
        }

        .adm-toggle {
          display: flex; align-items: center; gap: 8px;
          cursor: pointer;
        }
        .adm-toggle input { display: none; }
        .adm-toggle-track {
          width: 32px; height: 18px; border-radius: 9px;
          background: #1e2a38; transition: background 0.2s;
          position: relative;
        }
        .adm-toggle input:checked + .adm-toggle-track { background: #1e4060; }
        .adm-toggle-thumb {
          position: absolute; top: 3px; left: 3px;
          width: 12px; height: 12px; border-radius: 50%;
          background: #4a6070; transition: all 0.2s;
        }
        .adm-toggle input:checked ~ .adm-toggle-track .adm-toggle-thumb {
          left: 17px; background: #7ab3d4;
        }
        .adm-toggle-label { font-size: 0.72rem; color: #6a7a8a; }

        .adm-empty {
          text-align: center; padding: 48px 24px;
          color: #3a4a5a; font-size: 0.78rem;
          letter-spacing: 0.06em;
        }

        .adm-sidebar-toggle {
          padding: 12px 16px; border-top: 1px solid #1a2030;
          background: none; border-left: none; border-right: none; border-bottom: none;
          color: #3a4a5a; cursor: pointer; width: 100%;
          font-size: 0.7rem; text-align: left;
          letter-spacing: 0.08em; text-transform: uppercase;
          font-family: 'IBM Plex Mono', monospace;
        }
        .adm-sidebar-toggle:hover { color: #5a7a8a; }
      `}</style>

      {/* Sidebar */}
      <aside className={`adm-sidebar${sidebarOpen ? "" : " collapsed"}`}>
        <div className="adm-logo">
          <span className="adm-logo-mark">JLF Admin</span>
          {sidebarOpen && <span className="adm-logo-sub">John Luke Foundation</span>}
        </div>
        <nav className="adm-nav">
          {NAV.map(({ path, label, icon }) => (
            <NavLink
              key={path}
              to={`/admin${path ? `/${path}` : ""}`}
              end={path === ""}
              className={({ isActive }) => `adm-nav-link${isActive ? " active" : ""}`}
            >
              <span className="adm-nav-icon">{icon}</span>
              {sidebarOpen && label}
            </NavLink>
          ))}
        </nav>
        <button
          className="adm-sidebar-toggle"
          onClick={() => setSidebarOpen(o => !o)}
        >
          {sidebarOpen ? "← Collapse" : "→"}
        </button>
      </aside>

      {/* Main area */}
      <div className="adm-main">
        <div className="adm-topbar">
          <span className="adm-topbar-title">John Luke Foundation — Admin</span>
          <a href="/" target="_blank" className="adm-topbar-site">
            ↗ johnluke.art
          </a>
        </div>
        <div className="adm-content">
          <Routes>
            <Route index                  element={<AdminDashboard />} />
            <Route path="artworks"        element={<AdminArtworks />} />
            <Route path="artworks/:id"    element={<AdminArtworks />} />
            <Route path="documents"       element={<AdminDocuments />} />
            <Route path="documents/:id"   element={<AdminDocuments />} />
            <Route path="tagger"          element={<AdminTagger />} />
            <Route path="tagger/:docId"   element={<AdminTagger />} />
            <Route path="commissions"     element={<AdminCommissions />} />
            <Route path="timeline"        element={<AdminTimeline />} />
            <Route path="sessions"        element={<AdminSessions />} />
            <Route path="*"               element={<Navigate to="/admin" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

// ── Toggle component (exported for reuse) ─────────────────────────────────────
export function Toggle({ checked, onChange, label }) {
  return (
    <label className="adm-toggle">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <div className="adm-toggle-track">
        <div className="adm-toggle-thumb" />
      </div>
      {label && <span className="adm-toggle-label">{label}</span>}
    </label>
  );
}
