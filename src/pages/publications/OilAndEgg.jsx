import { Link } from "react-router-dom";
export default function Page() {
  return (
    <main>
      <section className="hero">
        <article>
          <div className="hero-content">
            <div className="preheading">Foundation Press · Technique</div>
            <h1>The Oil and the Egg: John Luke's Tempera Painting Technique</h1>
            <p>A complete technical account of John Luke's egg tempera practice — for painters, educators, conservators, and anyone who wants to understand how these extraordinary pictures were made.</p>
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
            <h2 className="H2">The Oil and the Egg: John Luke's Tempera Painting Technique</h2>
            <p>This spiral-bound technical title is in development. Register your interest to be notified of publication.</p>
          </div>
        </article>
      </section>
    </main>
  );
}
