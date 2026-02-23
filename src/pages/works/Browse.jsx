import { Link } from "react-router-dom";
export default function Page() {
  return (
    <main>
      <section className="hero">
        <article>
          <div className="hero-content">
            <div className="preheading">Works · Search</div>
            <h1>Browse & Search</h1>
            <p>Search and filter the full catalogue of 215 works by period, medium, theme, location, exhibition history, and technique.</p>
            <div className="btn-duo">
              <Link className="cta-primary dull" to="/works">← Back to Works</Link>
            </div>
          </div>
        </article>
      </section>
      <section className="panel light">
        <article>
          <div className="panel-content" style={{ width: "100%" }}>
            <div className="preheading">In development</div>
            <h2 className="H2">Browse & Search</h2>
            <p>Full search and faceted browse functionality is in development, powered by the Neo4j graph database. This will allow discovery by any combination of artwork attributes.</p>
          </div>
        </article>
      </section>
    </main>
  );
}
