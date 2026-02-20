import { NavLink, Link } from "react-router-dom";

const navItem = ({ isActive }) => ({
  opacity: isActive ? 1 : 0.9,
  fontWeight: isActive ? 600 : 400,
});

export default function SiteHeader() {
  return (
    <>
      <div className="page-bar">
        <div>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <span style={{ fontWeight: 600 }}>John Luke Foundation</span>
            <span style={{ opacity: 0.9 }}>Foundation website demo</span>
          </div>
          <div className="page-bar-link-iconic">
            <a href="mailto:info@johnluke.art">info@johnluke.art</a>
          </div>
        </div>
      </div>

      <header>
        <div>
          <nav>
            <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
              <span className="H3" style={{ fontSize: "1.3rem" }}>
                John Luke Foundation
              </span>
            </Link>

            <ul className="header-links">
              <li>
                <NavLink to="/about" style={navItem}>
                  Foundation
                </NavLink>
              </li>

              {/* Works dropdown */}
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
                <NavLink to="/archive" style={navItem}>
                  Archive
                </NavLink>
              </li>

              <li>
                <NavLink to="/exhibitions" style={navItem}>
                  Exhibitions
                </NavLink>
              </li>

              <li>
                <NavLink to="/trustee-prospectus" style={navItem}>
                  Trustees
                </NavLink>
              </li>

              <li>
                <NavLink className="cta-primary dull" to="/contact">
                  Contact
                </NavLink>
              </li>
            </ul>
          </nav>
        </div>
      </header>
    </>
  );
}
