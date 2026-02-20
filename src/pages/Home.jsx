import { Link } from "react-router-dom";

const Card = ({ title, text, to }) => (
  <div
    style={{
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.14)",
      borderRadius: "0.275rem",
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      minHeight: "160px",
    }}
  >
    <div className="H3">{title}</div>
    <p style={{ opacity: 0.92 }}>{text}</p>
    <div style={{ marginTop: "auto" }}>
      <Link className="cta-primary outline" to={to}>
        Explore
      </Link>
    </div>
  </div>
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
              A structured home for John Luke’s artworks, documents, letters, exhibitions,
              and research — presented with academic rigour and public accessibility.
            </p>

            <div className="btn-duo">
              <Link className="cta-primary" to="/archive">Visit the archive</Link>
              <Link className="cta-primary dull" to="/trustee-prospectus">Trusteeship</Link>
            </div>
          </div>

          <img
            className="panel-media contain hero-img-small"
            src="/images/john-luke-pencil-portrait.png"
            alt="John Luke pencil portrait"
          />
        </article>
      </section>

      <section className="panel">
        <article style={{ alignItems: "stretch" }}>
          <div className="panel-content" style={{ width: "100%" }}>
            <div className="preheading">Explore</div>
            <h2 className="H2">Foundation website structure</h2>
            <p>
              Start with the essentials: the Foundation, the Archive, Exhibitions, and
              Trustee information.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: "18px",
                marginTop: "10px",
              }}
            >
              <Card title="Foundation" text="Purpose, governance, programmes, partnerships." to="/about" />
              <Card title="Archive" text="Collections, cataloguing, access, digital platform." to="/archive" />
              <Card title="Exhibitions" text="Current and past exhibitions, loans, events." to="/exhibitions" />
              <Card title="Trustees" text="Founding trustee roles, committees, responsibilities." to="/trustee-prospectus" />
              <Card title="Contact" text="Enquiries, partnerships, archive collaboration." to="/contact" />
              <Card title="News & Media" text="Updates, press, talks, video content." to="/exhibitions" />
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
