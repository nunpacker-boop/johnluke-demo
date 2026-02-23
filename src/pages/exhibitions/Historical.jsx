import { Link } from "react-router-dom";
export default function Page() {
  return (
    <main>
      <section className="hero">
        <article>
          <div className="hero-content">
            <div className="preheading">Exhibitions · 1935–1975</div>
            <h1>Historical Exhibitions</h1>
            <p>Fourteen exhibitions between 1935 and 1975 — RUA annuals, CEMA festivals, and posthumous shows — documented with works shown, venues, and catalogue references.</p>
            <div className="btn-duo">
              <Link className="cta-primary dull" to="/exhibitions">← Back to Exhibitions</Link>
            </div>
          </div>
        </article>
      </section>
      <section className="panel light">
        <article>
          <div className="panel-content" style={{ width: "100%" }}>
            <div className="preheading">In development</div>
            <h2 className="H2">Historical Exhibitions</h2>
            <p>The full historical exhibition browser is in development, powered by the exhibition data already in the Neo4j database. Each exhibition will show works exhibited, venue, dates, and catalogue numbers.</p>
          </div>
        </article>
      </section>
    </main>
  );
}
