import { Link } from "react-router-dom";
const cards = [
  { label: "Personal correspondence", title: "Letters & Correspondence", body: "Private letters to and from John Luke — a rich primary source for understanding the person behind the paintings.", to: "/archive/letters" },
  { label: "Never before seen", title: "Sketches & Drawings", body: "Original preparatory drawings and sketches, many never previously published — the working mind of a master draughtsman.", to: "/archive/sketches" },
  { label: "Documentary", title: "Photographs", body: "Photographs of John Luke, his studio, his Belfast world, and documentary images of works in situ.", to: "/archive/photographs" },
  { label: "Critical record", title: "Press & Publications", body: "Newspaper reviews, magazine articles, exhibition catalogues, and contemporary critical writing about Luke's work.", to: "/archive/press-and-publications" },
  { label: "For researchers", title: "Request Access", body: "Some archive material is held in restricted access. Researchers can apply to view high-resolution scans and original documents.", to: "/archive/request-access" },
];
export default function Archive() {
  return (
    <main>
      <section className="hero">
        <article>
          <div className="hero-content">
            <div className="preheading">Archive</div>
            <h1>Primary sources. Original material.</h1>
            <p>Letters, sketches, photographs, press clippings, and documents — the raw material of John Luke's life and work, preserved and made accessible for the first time.</p>
            <div className="section-subnav">
              <Link to="/archive/letters">Letters</Link>
              <Link to="/archive/sketches">Sketches</Link>
              <Link to="/archive/photographs">Photographs</Link>
              <Link to="/archive/press-and-publications">Press</Link>
              <Link to="/archive/request-access">Request Access</Link>
            </div>
          </div>
        </article>
      </section>
      <section className="panel light">
        <article>
          <div className="panel-content" style={{ width: "100%" }}>
            <div className="preheading">Collections</div>
            <h2 className="H2">The archive collections</h2>
            <div className="card-grid" style={{ marginTop: 16 }}>
              {cards.map(c => (
                <Link key={c.to} className="card light" to={c.to}>
                  <div className="card-label">{c.label}</div>
                  <div className="card-title">{c.title}</div>
                  <p className="card-body">{c.body}</p>
                  <div className="card-cta">Browse →</div>
                </Link>
              ))}
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
