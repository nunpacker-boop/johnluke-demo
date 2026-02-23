import { Link } from "react-router-dom";
export default function Page() {
  return (
    <main>
      <section className="hero">
        <article>
          <div className="hero-content">
            <div className="preheading">Archive · Drawings</div>
            <h1>Sketches & Drawings</h1>
            <p>Original preparatory drawings and sketches by John Luke — many never before published or exhibited.</p>
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
            <h2 className="H2">Sketches & Drawings</h2>
            <p>The Sketches collection is being photographed, catalogued, and related to finished works. Entries will be published progressively.</p>
          </div>
        </article>
      </section>
    </main>
  );
}
