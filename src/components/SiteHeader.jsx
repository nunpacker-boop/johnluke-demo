import { useState, useEffect, useRef } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";

const navItem = ({ isActive }) => ({
  opacity: isActive ? 1 : 0.9,
  fontWeight: isActive ? 600 : 400,
});

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const menuRef = useRef(null);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <header ref={menuRef}>
      <div>
        <nav>
          {/* Logo / wordmark */}
          <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
            <span className="H3" style={{ fontSize: "1.3rem" }}>
              John Luke Foundation
            </span>
          </Link>

          {/* ── Desktop nav ──────────────────────────────────── */}
          <ul className="header-links desktop-nav">
            <li>
              <NavLink to="/about" style={navItem}>Foundation</NavLink>
            </li>

            <li className="header-dropdown">
              <span className="header-dropdown-btn">Works</span>
              <ul className="header-dropdown-list">
                <li>
                  <NavLink to="/selected-catalogue" style={navItem}>
                    Selected Catalogue
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/living-catalogue" style={navItem}>
                    Living Catalogue Raisonné
                  </NavLink>
                </li>
              </ul>
            </li>

            <li>
              <NavLink to="/archive" style={navItem}>Archive</NavLink>
            </li>
            <li>
              <NavLink to="/exhibitions" style={navItem}>Exhibitions</NavLink>
            </li>
            <li>
              <NavLink to="/trustee-prospectus" style={navItem}>Trustees</NavLink>
            </li>
            <li>
              <NavLink className="cta-primary dull" to="/contact">Contact</NavLink>
            </li>
          </ul>

          {/* ── Hamburger button (mobile only) ───────────────── */}
          <button
            className="hamburger"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className={`hamburger-icon ${menuOpen ? "open" : ""}`}>
              <span /><span /><span />
            </span>
          </button>
        </nav>
      </div>

      {/* ── Mobile drawer ────────────────────────────────────── */}
      <div className={`mobile-nav ${menuOpen ? "mobile-nav--open" : ""}`} aria-hidden={!menuOpen}>
        <ul className="mobile-nav-list">
          <li>
            <NavLink to="/about" style={navItem}>Foundation</NavLink>
          </li>

          <li className="mobile-nav-group">
            <span className="mobile-nav-group-label">Works</span>
            <ul className="mobile-nav-sub">
              <li>
                <NavLink to="/selected-catalogue" style={navItem}>
                  Selected Catalogue
                </NavLink>
              </li>
              <li>
                <NavLink to="/living-catalogue" style={navItem}>
                  Living Catalogue Raisonné
                </NavLink>
              </li>
            </ul>
          </li>

          <li>
            <NavLink to="/archive" style={navItem}>Archive</NavLink>
          </li>
          <li>
            <NavLink to="/exhibitions" style={navItem}>Exhibitions</NavLink>
          </li>
          <li>
            <NavLink to="/trustee-prospectus" style={navItem}>Trustees</NavLink>
          </li>
          <li className="mobile-nav-cta">
            <NavLink to="/contact">Contact</NavLink>
          </li>
        </ul>
      </div>
    </header>
  );
}
