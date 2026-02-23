import { useState, useEffect, useRef } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";

const navItem = ({ isActive }) => ({
  opacity: isActive ? 1 : 0.9,
  fontWeight: isActive ? 600 : 400,
});

const NAV = [
  {
    label: "John Luke",
    path: "/john-luke",
    children: [
      { label: "Life & Times", path: "/john-luke/life-and-times" },
      { label: "Technique & Method", path: "/john-luke/technique-and-method" },
      { label: "Influences & Context", path: "/john-luke/influences-and-context" },
      { label: "John's Writing", path: "/john-luke/johns-writing" },
      { label: "Reading List", path: "/john-luke/reading-list" },
      { label: "Family Tree", path: "/john-luke/family-tree" },
    ],
  },
  {
    label: "Works",
    path: "/works",
    children: [
      { label: "Selected Catalogue", path: "/works/selected-catalogue" },
      { label: "Living Catalogue Raisonné", path: "/works/living-catalogue" },
      { label: "Browse & Search", path: "/works/browse" },
    ],
  },
  {
    label: "Archive",
    path: "/archive",
    children: [
      { label: "Letters & Correspondence", path: "/archive/letters" },
      { label: "Sketches & Drawings", path: "/archive/sketches" },
      { label: "Photographs", path: "/archive/photographs" },
      { label: "Press & Publications", path: "/archive/press-and-publications" },
      { label: "Request Access", path: "/archive/request-access" },
    ],
  },
  {
    label: "Exhibitions",
    path: "/exhibitions",
    children: [
      { label: "Historical Exhibitions", path: "/exhibitions/historical" },
      { label: "Foundation Events", path: "/exhibitions/events" },
    ],
  },
  {
    label: "Publications",
    path: "/publications",
    children: [
      { label: "Biography", path: "/publications/biography" },
      { label: "The Quiet Eye", path: "/publications/the-quiet-eye" },
      { label: "Selected Catalogue", path: "/publications/selected-catalogue" },
      { label: "The John Luke Letters", path: "/publications/the-letters" },
      { label: "The Oil and the Egg", path: "/publications/the-oil-and-the-egg" },
      { label: "Philosophy of Art", path: "/publications/philosophy-of-art" },
    ],
  },
  {
    label: "Writing",
    path: "/writing",
    children: [],
  },
  {
    label: "Foundation",
    path: "/foundation",
    children: [
      { label: "About & Mission", path: "/foundation/about" },
      { label: "Programmes", path: "/foundation/programmes" },
      { label: "Trustees", path: "/foundation/trustees" },
      { label: "Partners", path: "/foundation/partners" },
      { label: "Press & Media", path: "/foundation/press" },
      { label: "News", path: "/foundation/news" },
    ],
  },
];

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(null);
  const location = useLocation();
  const headerRef = useRef(null);

  useEffect(() => {
    setMenuOpen(false);
    setMobileExpanded(null);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <header ref={headerRef}>
      <div>
        <nav>
          <Link to="/" className="site-wordmark">
            <span className="site-wordmark-main">John Luke Foundation</span>
          </Link>

          {/* ── Desktop nav ──────────────────────────────────── */}
          <ul className="header-links desktop-nav">
            {NAV.map((item) => (
              <li key={item.path} className={item.children.length ? "header-dropdown" : ""}>
                {item.children.length ? (
                  <>
                    <NavLink
                      to={item.path}
                      className="header-dropdown-btn-link"
                      style={navItem}
                    >
                      {item.label}
                    </NavLink>
                    <ul className="header-dropdown-list">
                      {item.children.map((child) => (
                        <li key={child.path}>
                          <NavLink to={child.path} style={navItem}>
                            {child.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <NavLink to={item.path} style={navItem}>
                    {item.label}
                  </NavLink>
                )}
              </li>
            ))}
            <li>
              <NavLink className="cta-primary dull" to="/contact">
                Contact
              </NavLink>
            </li>
          </ul>

          {/* ── Hamburger ────────────────────────────────────── */}
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
      <div
        className={`mobile-nav ${menuOpen ? "mobile-nav--open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <ul className="mobile-nav-list">
          {NAV.map((item) => (
            <li key={item.path} className={item.children.length ? "mobile-nav-group" : ""}>
              {item.children.length ? (
                <>
                  <button
                    className="mobile-nav-group-toggle"
                    onClick={() =>
                      setMobileExpanded(mobileExpanded === item.path ? null : item.path)
                    }
                    aria-expanded={mobileExpanded === item.path}
                  >
                    <span>{item.label}</span>
                    <span className={`mobile-nav-chevron ${mobileExpanded === item.path ? "open" : ""}`}>
                      ›
                    </span>
                  </button>
                  <ul
                    className="mobile-nav-sub"
                    style={{ display: mobileExpanded === item.path ? "block" : "none" }}
                  >
                    <li>
                      <NavLink to={item.path} style={navItem}>
                        {item.label} — Overview
                      </NavLink>
                    </li>
                    {item.children.map((child) => (
                      <li key={child.path}>
                        <NavLink to={child.path} style={navItem}>
                          {child.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <NavLink to={item.path} style={navItem}>
                  {item.label}
                </NavLink>
              )}
            </li>
          ))}
          <li className="mobile-nav-cta">
            <NavLink to="/contact">Contact</NavLink>
          </li>
        </ul>
      </div>
    </header>
  );
}
