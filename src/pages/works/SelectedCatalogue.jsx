import { Link } from "react-router-dom";

export default function SelectedCatalogue() {
  return (
    <main>
      {/* Hero */}
      <section className="hero">
        <article>
          <div className="hero-content">
            <div className="preheading">Works</div>
            <h1>Selected Catalogue of Works</h1>
            <p>
              A curated selection—approximately one hundred key works—presented with deep commentary:
              technique, context, intent, sequence, and relationships to other paintings, drawings,
              studies, and commissions.
            </p>

            <div className="btn-duo">
              <a className="cta-primary" href="#what-it-includes">
                What it includes
              </a>
              <Link className="cta-primary dull" to="/living-catalogue">
                Explore the Living Catalogue
              </Link>
            </div>
          </div>

          <div
            className="panel-media"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "0.275rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
              textAlign: "center",
            }}
          >
            <div style={{ maxWidth: 360 }}>
              <div className="H4" style={{ marginBottom: 10 }}>
                Depth over breadth
              </div>
              <p style={{ opacity: 0.9 }}>
                A publishable catalogue designed to be read—anchored in scholarship and high-quality
                imagery.
              </p>
            </div>
          </div>
        </article>
      </section>

      {/* What it is */}
      <section id="what-it-includes" className="panel">
        <article>
          <div className="panel-content">
            <div className="preheading">Scope</div>
            <h2 className="H2">What the Selected Catalogue does</h2>
            <p>
              This is not an attempt at total completeness. It is a carefully chosen body of work
              that shows John Luke’s range, development, and technical mastery—presented to museum
              standards.
            </p>
            <ul>
              <li>
                <strong>Representative</strong> — key periods, subjects, and experiments.
              </li>
              <li>
                <strong>Readable</strong> — narrative entries that explain meaning and making.
              </li>
              <li>
                <strong>Precise</strong> — dimensions, media, dates, provenance where known.
              </li>
              <li>
                <strong>Connected</strong> — links to studies, variants, and thematic sequences.
              </li>
            </ul>
          </div>

          <div className="panel-media" style={{ background: "white" }}>
            <div style={{ padding: 24 }}>
              <h3 className="H3" style={{ color: "var(--shadow)" }}>
                A typical entry contains
              </h3>
              <p style={{ color: "var(--shadow)", marginTop: 10 }}>
                High-res image • Catalogue number • Title • Date • Medium/support • Measurements •
                Context and intent • Technical notes (materials, layering, drawing method) • Related
                works • Exhibition / publication references • Where it can be seen today (where
                appropriate)
              </p>
            </div>
          </div>
        </article>
      </section>

      {/* Why this approach */}
      <section className="panel dim">
        <article>
          <div className="panel-content">
            <div className="preheading">Rationale</div>
            <h2 className="H2">Why this approach fits John Luke</h2>
            <p>
              Many works are privately held, undocumented, or intermittently visible. A Selected
              Catalogue establishes a high-quality scholarly foundation now—while the Living Catalogue
              continues to grow over time.
            </p>
            <p>
              Together, they provide both a stable “published” reference and a platform for ongoing
              discovery.
            </p>
          </div>

          <div className="panel-media" style={{ background: "white" }}>
            <div style={{ padding: 24 }}>
              <h3 className="H3" style={{ color: "var(--shadow)" }}>
                Two catalogues, one mission
              </h3>
              <ul style={{ marginTop: 12, color: "var(--shadow)" }}>
                <li>
                  <strong>Selected Catalogue</strong> — stable, curated, deeply written.
                </li>
                <li>
                  <strong>Living Catalogue</strong> — open-ended, evidence-driven, evolving.
                </li>
              </ul>
            </div>
          </div>
        </article>
      </section>

      {/* CTA */}
      <section className="panel">
        <article>
          <div className="panel-content">
            <div className="preheading">Next</div>
            <h2 className="H2">Get involved</h2>
            <p>
              If you can help locate works, provide photographs, share archival material, or support
              publication-quality photography and rights clearance, we’d love to hear from you.
            </p>
            <div className="btn-duo">
              <Link className="cta-primary" to="/contact">
                Contact the Foundation
              </Link>
              <Link className="cta-primary dull" to="/living-catalogue">
                Visit the Living Catalogue
              </Link>
            </div>
          </div>

          <div className="panel-media" style={{ background: "white" }}>
            <div style={{ padding: 24 }}>
              <h3 className="H3" style={{ color: "var(--shadow)" }}>
                Publishing-grade standard
              </h3>
              <p style={{ color: "var(--shadow)", marginTop: 10 }}>
                The goal is a book and a digital edition worthy of the work—beautifully typeset,
                carefully reproduced, rigorously sourced.
              </p>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
