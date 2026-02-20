import { Link } from "react-router-dom";

export default function LivingCatalogue() {
  return (
    <main>
      {/* Hero */}
      <section className="hero">
        <article>
          <div className="hero-content">
            <div className="preheading">Works</div>
            <h1>Living Catalogue Raisonné</h1>
            <p>
             Purpose of the Living Catalogue: A continuously evolving catalogue documenting every known, lost, rediscovered, attributed, or uncertain work by John Luke.
Because many artworks are dispersed across private collections, undocumented, or only known from exhibition catalogues, letters, or poor-quality photographs, a traditional “final” catalogue raisonné is not feasible. The Living Catalogue reflects the Foundation’s commitment to an evidence-based but non-final form — a catalogue that grows as new information emerges.

Why this catalogue is needed: 

Research on Luke is fragmented, often hidden in private archives, dispersed exhibition histories, family letters, and scattered photographic sources. No single body has ever coordinated or preserved:

high-resolution images of artworks

archival letters and photographs

technical notes

genealogical and historical context

digitised archives

public heritage assets

educational material

            </p>

            <div className="btn-duo">
              <a className="cta-primary" href="#how-it-works">
                How it works
              </a>
              <Link className="cta-primary dull" to="/contact">
                Contribute information
              </Link>
            </div>
          </div>

          {/* Replace with a relevant archive/work image when you have one */}
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
                A catalogue that can grow forever
              </div>
              <p style={{ opacity: 0.9 }}>
                Like a long-term civic work—built carefully, expanded responsibly, never rushed.
              </p>
            </div>
          </div>
        </article>
      </section>

      {/* What it is */}
      <section className="panel">
        <article>
          <div className="panel-content">
            <div className="preheading">Definition</div>
            <h2 className="H2">What “living” means</h2>
            <p>
              A traditional catalogue raisonné aims to be complete and final. For John Luke, that
              ideal is difficult: works are scattered, privately held, sometimes undocumented, and
              locations can change.
            </p>
            <p>
              A living catalogue acknowledges uncertainty and change. It records what is known today,
              keeps careful notes on what is not yet verified, and welcomes credible new evidence as it
              appears.
            </p>
          </div>

          <div className="panel-media" style={{ background: "white" }}>
            <div style={{ padding: 24 }}>
              <h3 className="H3" style={{ color: "var(--shadow)" }}>
                Included record types
              </h3>
              <ul style={{ marginTop: 12, color: "var(--shadow)" }}>
                <li>Confirmed works (seen/photographed, verified provenance)</li>
                <li>Attributed works (credible but still under review)</li>
                <li>Lost works (known from references, photos, letters, catalogues)</li>
                <li>Rediscovered works (re-emerge after long gaps)</li>
                <li>Related materials (sketches, studies, mural fragments, documents)</li>
              </ul>
            </div>
          </div>
        </article>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="panel dim">
        <article>
          <div className="panel-content">
            <div className="preheading">Method</div>
            <h2 className="H2">How the catalogue is built</h2>
            <p>
              Entries are created from primary evidence (photographs, letters, exhibition catalogues,
              sales records, studio notes) and then refined as new sources appear.
            </p>
            <ul>
              <li>
                <strong>Evidence-first records</strong> — every claim is tied to sources or
                clearly flagged as provisional.
              </li>
              <li>
                <strong>Versioned updates</strong> — corrections are logged rather than overwritten.
              </li>
              <li>
                <strong>Relationships</strong> — works link to studies, variants, commissions,
                and thematic sequences.
              </li>
              <li>
                <strong>Respectful privacy</strong> — owners can remain anonymous; locations can be
                generalised where appropriate.
              </li>
            </ul>
          </div>

          <div className="panel-media" style={{ background: "white" }}>
            <div style={{ padding: 24 }}>
              <h3 className="H3" style={{ color: "var(--shadow)" }}>
                What a typical entry contains
              </h3>
              <p style={{ color: "var(--shadow)", marginTop: 10 }}>
                Title • Date range • Medium • Support • Dimensions • Inscriptions • Condition notes •
                Provenance summary • Exhibition history • Literature • High-res imagery • Related works
                • Scholarly commentary • Verification status
              </p>
            </div>
          </div>
        </article>
      </section>

      {/* Call to action */}
      <section className="panel">
        <article>
          <div className="panel-content">
            <div className="preheading">Help</div>
            <h2 className="H2">How you can contribute</h2>
            <p>
              If you own a work, have a photograph, recall an exhibition, or can help identify a
              location, your information may close an important gap.
            </p>
            <div className="btn-duo">
              <Link className="cta-primary" to="/contact">
                Share information privately
              </Link>
              <Link className="cta-primary dull" to="/selected-catalogue">
                Explore the Selected Catalogue
              </Link>
            </div>
          </div>

          <div className="panel-media" style={{ background: "white" }}>
            <div style={{ padding: 24 }}>
              <h3 className="H3" style={{ color: "var(--shadow)" }}>
                A careful approach
              </h3>
              <p style={{ color: "var(--shadow)", marginTop: 10 }}>
                The catalogue grows through trust, evidence, and patience—never pressure.
              </p>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
