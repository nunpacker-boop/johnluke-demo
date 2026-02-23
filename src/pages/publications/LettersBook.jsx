import { Link } from "react-router-dom";
export default function Page() {
  return (
    <main>
      <section className="hero">
        <article>
          <div className="hero-content">
            <div className="preheading">Foundation Press · Letters</div>
            <h1>The John Luke Letters</h1>
            <p>Edited and annotated correspondence — John Luke in his own words, writing to contemporaries, friends, and students about art, life, and the struggle to see clearly.</p>
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
            <h2 className="H2">The John Luke Letters</h2>
            <p>The Letters volume is in development. Register your interest to be notified of publication.</p>
          </div>
        </article>
      </section>
    </main>
  );
}
