const nav = [
  { label: "Purpose", href: "#purpose" },
  { label: "Programmes", href: "#programmes" },
  { label: "Governance", href: "#governance" },
  { label: "Funding", href: "#funding" },
  { label: "Trustees", href: "#trustees" },
];

export default function TrusteeProspectus() {
  return (
    <>
      <main>
        {/* Hero */}
        <section className="hero">
          <article>
            <div className="hero-content">
              <div className="preheading">Trustee Prospectus</div>
              <h1>John Luke Foundation</h1>
              <p>
                A centre of excellence dedicated to preserving, interpreting, and promoting the
                life and work of John Luke — with publishing, education, and digital heritage
                programmes to broaden access and scholarship.
              </p>

              <div className="btn-duo">
                <a className="cta-primary" href="#purpose">
                  Explore the plan
                </a>
                <a className="cta-primary dull" href="#contact">
                  Get in touch
                </a>
              </div>
            </div>

            <img
              className="panel-media contain hero-img-small"
              src="/images/john-luke-pencil-portrait.png"
              alt="John Luke pencil portrait"
            />
          </article>
        </section>

        {/* Panels */}
        <section id="purpose" className="panel">
          <article>
            <div className="panel-content">
              <div className="preheading">Purpose</div>
              <h2 className="H2">Why the Foundation exists</h2>
              <p>
                The Foundation consolidates scholarship, imagery, and archive materials relating
                to John Luke, presenting them with academic rigour and public accessibility.
              </p>
            </div>

            <img
              className="panel-media"
              loading="lazy"
              src="/images/john-luke-the-dancer-and-the-bubble-1947.jpeg"
              alt="John Luke - The Dancer and the Bubble"
            />
          </article>
        </section>

        <section id="programmes" className="panel">
          <article>
            <div className="panel-content">
              <div className="preheading">Programmes</div>
              <h2 className="H2">Core programmes</h2>
              <ul>
                <li>
                  <strong>Digital Archive</strong> — imagery, letters, documents, provenance,
                  timelines, and maps.
                </li>
                <li>
                  <strong>Foundation Press</strong> — biography, monographs, reissues, and
                  educational publications.
                </li>
                <li>
                  <strong>Annual Prize</strong> — life drawing prize and public exhibition.
                </li>
                <li>
                  <strong>Culture Trail</strong> — interpretative panels and QR-linked content.
                </li>
              </ul>
            </div>

            <img
              className="panel-media"
              loading="lazy"
              src="/images/john-luke-the-old-callan-bridge-1945.jpg"
              alt="John Luke - The Old Callan Bridge 1945"
            />
          </article>
        </section>

        <section id="governance" className="panel dim">
          <article>
            <div className="panel-content">
              <div className="preheading">Governance</div>
              <h2 className="H2">How it will be run</h2>
              <p>
                A Board of trustees supported by advisory panels spanning scholarship,
                conservation, education, digital archiving, publishing, and finance/legal
                oversight.
              </p>
            </div>

            <div className="panel-media" style={{ background: "white" }}>
              <div style={{ padding: 24 }}>
                <h3 className="H3" style={{ color: "var(--shadow)" }}>
                  Advisory panels
                </h3>
                <p style={{ color: "var(--shadow)", marginTop: 10 }}>
                  Scholarship • Conservation • Education • Publishing
                </p>
              </div>
            </div>
          </article>
        </section>

        <section id="funding" className="panel">
          <article>
            <div className="panel-content">
              <div className="preheading">Funding</div>
              <h2 className="H2">Funding & sustainability</h2>
              <p>
                Early funding via grants, philanthropy, and partnerships; long-term sustainability
                via publishing, rights, programmes, events, and donations.
              </p>
              <div className="btn-duo">
                <a className="cta-primary dull" href="#contact">
                  Discuss partnership options
                </a>
                <a className="cta-primary dull" href="#trustees">
                  Trustee role outline
                </a>
              </div>
            </div>

            <img
              className="panel-media"
              loading="lazy"
              src="/images/john-luke-the-road-to-the-west-1944.png"
              alt="John Luke - The Road to the West 1944"
            />
          </article>
        </section>

        <section id="trustees" className="panel">
          <article>
            <div className="panel-content">
              <div className="preheading">Trustees</div>
              <h2 className="H2">Register interest</h2>
              <p>
                Founding trustees shape governance, partnerships, and credibility — ensuring the
                Foundation is built on integrity and excellence.
              </p>
              <a className="cta-primary" href="#contact">
                Register interest
              </a>
            </div>

            <img
              className="panel-media"
              loading="lazy"
              src="/images/john-luke-the-three-dancers-1945.png"
              alt="John Luke - The Three Dancers 1945"
            />
          </article>
        </section>

        <section id="contact" className="panel">
          <article>
            <div className="panel-content">
              <div className="preheading">Contact</div>
              <h2 className="H2">Get in touch</h2>
              <p>Email is best for the demo right now.</p>
              <a className="cta-primary inverted" href="mailto:info@johnluke.art">
                info@johnluke.art
              </a>
            </div>

            <img
              className="panel-media"
              loading="lazy"
              src="/images/john-luke-the-tipster-1928.png"
              alt="John Luke - The Tipster 1928"
            />
          </article>
        </section>
      </main>

    </>
  );
}
