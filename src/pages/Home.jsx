import { Link } from "react-router-dom";

const SectionCard = ({ label, title, body, to }) => (
  <Link className="card" to={to}>
    <div className="card-label">{label}</div>
    <div className="card-title">{title}</div>
    <p className="card-body">{body}</p>
    <div className="card-cta">Explore →</div>
  </Link>
);

export default function Home() {
  return (
    <main>
      <section className="hero">
        <article>
          <div className="hero-content">
            <div className="preheading">John Luke Foundation</div>
            <h1>Archive. Scholarship. Public access.</h1>
            <p>
              A centre of excellence dedicated to preserving, interpreting, and promoting
              the life and work of John Luke — through publishing, education, and digital heritage.
            </p>
            <div className="btn-duo">
              <Link className="cta-primary" to="/works/browse">Explore the works</Link>
              <Link className="cta-primary dull" to="/john-luke/life-and-times">John Luke's story</Link>
            </div>
          </div>
          <img
            className="panel-media contain hero-img-small"
            src="/images/john-luke-pencil-portrait.png"
            alt="John Luke pencil portrait"
          />
        </article>
      </section>

      <section className="panel light">
        <article>
          <div className="panel-content" style={{ width: "100%" }}>
            <div className="preheading">Explore</div>
            <h2 className="H2">What you'll find here</h2>
            <p>215 catalogued works, private letters, original sketches, John's own writing, exhibition records, and a growing body of Foundation scholarship — all in one place.</p>
            <div className="card-grid" style={{ marginTop: 24 }}>
              <SectionCard label="The artist" title="John Luke" body="His life, technique, influences, and his own writing about art." to="/john-luke" />
              <SectionCard label="Catalogue" title="Works" body="215 works catalogued. Selected Catalogue, Living Catalogue Raisonné, and full browse." to="/works" />
              <SectionCard label="Primary sources" title="Archive" body="Letters, sketches, photographs, press clippings — the raw material of his life." to="/archive" />
              <SectionCard label="1935–1975" title="Exhibitions" body="Every exhibition Luke participated in, with works shown and venue records." to="/exhibitions" />
              <SectionCard label="Foundation Press" title="Publications" body="Books in development: biography, catalogue, letters, technique guides." to="/publications" />
              <SectionCard label="Essays & research" title="Writing" body="Long-form Foundation writing on Luke's work, stories, and discoveries." to="/writing" />
            </div>
          </div>
        </article>
      </section>

      <section className="panel">
        <article>
          <div className="panel-content">
            <div className="preheading">Foundation</div>
            <h2 className="H2">About the Foundation</h2>
            <p>Established to address a significant cultural gap — the absence of a dedicated institution to preserve, interpret, and promote John Luke's work and legacy.</p>
            <div className="btn-duo">
              <Link className="cta-primary" to="/foundation/about">Our mission</Link>
              <Link className="cta-primary dull" to="/foundation/trustees">Trustees</Link>
            </div>
          </div>
          <img className="panel-media" src="/images/john-luke-the-three-dancers-1945.png" alt="John Luke — The Three Dancers, 1945" loading="lazy" />
        </article>
      </section>

      <section className="panel dim">
        <article>
          <div className="panel-content">
            <div className="preheading">Register a work</div>
            <h2 className="H2">Do you own a John Luke?</h2>
            <p>If you own a work — or believe you might — the Foundation offers a confidential registration and verification service. Your privacy is fully protected.</p>
            <Link className="cta-primary" to="/contact/register-a-work">Register a work</Link>
          </div>
          <div className="panel-media" style={{ background: "white", borderRadius: "0.275rem" }}>
            <div style={{ padding: 28 }}>
              <h3 className="H3" style={{ color: "var(--shadow)" }}>Fully confidential</h3>
              <p style={{ color: "var(--shadow)", marginTop: 10 }}>Your identity and the location of any work you register will never be published without your explicit written consent.</p>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
