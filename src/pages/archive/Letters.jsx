import { Link } from "react-router-dom";
export default function Page() {
  return (
    <main>
      <section className="hero">
        <article>
          <div className="hero-content">
            <div className="preheading">Archive · Letters</div>
            <h1>Letters & Correspondence</h1>
            <p>Private letters to and from John Luke, spanning his career from his student years through to his final decade.</p>
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
            <h2 className="H2">Letters & Correspondence</h2>
            <p>The Letters collection is being digitised, transcribed, and annotated. Access to individual records will open progressively as the work is completed.</p>
          </div>
        </article>
      </section>
    </main>
  );
}
