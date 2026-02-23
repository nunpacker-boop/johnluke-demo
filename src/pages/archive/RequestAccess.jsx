import { Link } from "react-router-dom";
export default function Page() {
  return (
    <main>
      <section className="hero">
        <article>
          <div className="hero-content">
            <div className="preheading">Archive · Researchers</div>
            <h1>Request Access</h1>
            <p>Some archive material is held in restricted access. Researchers, institutions, and publishers may apply to view high-resolution scans and original documents.</p>
            <div className="btn-duo">
              <Link className="cta-primary dull" to="/archive">← Back to Archive</Link>
            </div>
          </div>
        </article>
      </section>
      <section className="panel light">
        <article>
          <div className="panel-content" style={{ width: "100%" }}>
            <div className="preheading">In development</div>
            <h2 className="H2">Request Access</h2>
            <p>The access request system is in development. In the meantime, please contact the Foundation directly at info@johnluke.art.</p>
          </div>
        </article>
      </section>
    </main>
  );
}
