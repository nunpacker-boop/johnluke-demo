import { Link } from "react-router-dom";
export default function Page() {
  return (
    <main>
      <section className="hero">
        <article>
          <div className="hero-content">
            <div className="preheading">Foundation Press · Philosophy</div>
            <h1>John Luke's Philosophy of Art</h1>
            <p>Luke's own thinking on art, technique, vision, and the purpose of painting — drawn from thousands of words of previously unpublished writing.</p>
            <div className="btn-duo">
              <Link className="cta-primary dull" to="/publications">← Back to Publications</Link>
            </div>
          </div>
        </article>
      </section>
      <section className="panel light">
        <article>
          <div className="panel-content" style={{ width: "100%" }}>
            <div className="preheading">In development</div>
            <h2 className="H2">John Luke's Philosophy of Art</h2>
            <p>This title draws directly on Luke's own writing. Register your interest to be notified of publication.</p>
          </div>
        </article>
      </section>
    </main>
  );
}
