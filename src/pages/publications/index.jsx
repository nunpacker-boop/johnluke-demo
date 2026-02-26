import { Link } from "react-router-dom";
const books = [
  { label: "Standard hardback", badge: "Forthcoming", title: "John Luke: A Biography", body: "The first full biography of John Luke — from North Belfast to the Slade, and back to Belfast.", to: "/publications/biography" },
  { label: "Spiral-bound · Educational", badge: "Forthcoming", title: "The Quiet Eye", body: "The mind and vision of drawing by John Luke. For educators and art students.", to: "/publications/the-quiet-eye" },
  { label: "Large format hardback", badge: "Forthcoming", title: "The Selected Catalogue", body: "A museum-quality catalogue of approximately fifty key works with deep scholarly commentary.", to: "/publications/selected-catalogue" },
  { label: "Standard hardback", badge: "Forthcoming", title: "The John Luke Letters", body: "Edited and annotated correspondence — John Luke in his own words to contemporaries and friends.", to: "/publications/the-letters" },
  { label: "Spiral-bound · Educational & research", badge: "Forthcoming", title: "The Oil and the Egg", body: "John Luke's egg tempera and oil painting technique — a complete technical account for educators and conservators.", to: "/publications/the-oil-and-the-egg" },
  { label: "Standard hardback", badge: "Forthcoming", title: "John Luke's Philosophy of Art", body: "Luke's own thinking on art, technique, and vision — drawn from thousands of words of previously unpublished writing.", to: "/publications/philosophy-of-art" },
];
export default function Publications() {
  return (
    <main>
      <section className="hero">
        <article>
          <div className="hero-content">
            <div className="preheading">Foundation Press</div>
            <h1>Books that the work deserves</h1>
            <p>Six publications in development — biography, catalogue, letters, technique, and philosophy. Each one a contribution to scholarship and a permanent record of an extraordinary life and body of work.</p>
            <div className="section-subnav">
              <Link to="/publications/biography">Biography</Link>
              <Link to="/publications/the-quiet-eye">The Quiet Eye</Link>
              <Link to="/publications/selected-catalogue">Selected Catalogue</Link>
              <Link to="/publications/the-letters">The Letters</Link>
              <Link to="/publications/the-oil-and-the-egg">The Oil and the Egg</Link>
              <Link to="/publications/philosophy-of-art">Philosophy of Art</Link>
            </div>
          </div>
        </article>
      </section>
      <section className="panel light">
        <article>
          <div className="panel-content" style={{ width: "100%" }}>
            <div className="preheading">In development</div>
            <h2 className="H2">Six titles from Foundation Press</h2>
            <div className="card-grid" style={{ marginTop: 16 }}>
              {books.map(b => (
                <Link key={b.to} className="card light" to={b.to}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                    <div className="card-label">{b.label}</div>
                    <span className="badge badge-forthcoming">{b.badge}</span>
                  </div>
                  <div className="card-title">{b.title}</div>
                  <p className="card-body">{b.body}</p>
                  <div className="card-cta">Learn more →</div>
                </Link>
              ))}
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
