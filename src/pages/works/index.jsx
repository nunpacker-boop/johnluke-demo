import { Link } from "react-router-dom";
const cards = [
  { label: "~100 key works", title: "Selected Catalogue", body: "A curated selection of John Luke's most significant works, presented with deep scholarly commentary, technique notes, and full provenance.", to: "/works/selected-catalogue" },
  { label: "215 works & growing", title: "Living Catalogue Raisonné", body: "A continuously evolving catalogue documenting every known, attributed, lost, or rediscovered work — evidence-based and non-final.", to: "/works/living-catalogue" },
  { label: "Search & filter", title: "Browse & Search", body: "Browse the full catalogue by period, medium, theme, location, exhibition, or technique. Search by title or raisonné number.", to: "/works/browse" },
];
export default function Works() {
  return (
    <main>
      <section className="hero">
        <article>
          <div className="hero-content">
            <div className="preheading">Works</div>
            <h1>215 catalogued works — and counting</h1>
            <p>From the earliest drawings through to the final paintings, John Luke's complete known output catalogued with scholarly rigour, full provenance, and exhibition history.</p>
            <div className="section-subnav">
              <Link to="/works/selected-catalogue">Selected Catalogue</Link>
              <Link to="/works/living-catalogue">Living Catalogue Raisonné</Link>
              <Link to="/works/browse">Browse & Search</Link>
            </div>
          </div>
          <img className="panel-media" src="/images/john-luke-the-old-callan-bridge-1945.jpg" alt="John Luke — The Old Callan Bridge, 1945" loading="lazy" />
        </article>
      </section>
      <section className="panel light">
        <article>
          <div className="panel-content" style={{ width: "100%" }}>
            <div className="preheading">Explore</div>
            <h2 className="H2">Three ways to approach the catalogue</h2>
            <div className="card-grid cols-3" style={{ marginTop: 16 }}>
              {cards.map(c => (
                <Link key={c.to} className="card light" to={c.to}>
                  <div className="card-label">{c.label}</div>
                  <div className="card-title">{c.title}</div>
                  <p className="card-body">{c.body}</p>
                  <div className="card-cta">Explore →</div>
                </Link>
              ))}
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
