import { Link } from "react-router-dom";
export default function Page() {
  return (
    <main>
      <section className="hero">
        <article>
          <div className="hero-content">
            <div className="preheading">Contact · Partners & Trustees</div>
            <h1>Partnership & Trusteeship</h1>
            <p>The Foundation welcomes enquiries from individuals interested in trustee roles, and from institutions and funders interested in partnership or grant support.</p>
            <div className="btn-duo">
              <Link className="cta-primary dull" to="/contact">← Back to Contact</Link>
            </div>
          </div>
        </article>
      </section>
      <section className="panel light">
        <article>
          <div className="panel-content" style={{ width: "100%" }}>
            <div className="preheading">In development</div>
            <h2 className="H2">Partnership & Trusteeship</h2>
            <p>Please contact info@johnluke.art to begin a conversation. The Trustee Prospectus is available on request.</p>
          </div>
        </article>
      </section>
    </main>
  );
}
