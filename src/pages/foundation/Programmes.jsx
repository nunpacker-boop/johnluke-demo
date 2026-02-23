import { Link } from "react-router-dom";
export default function Page() {
  return (
    <main>
      <section className="hero">
        <article>
          <div className="hero-content">
            <div className="preheading">Foundation · Work</div>
            <h1>Programmes</h1>
            <p>Four core programmes: Digital Archive, Foundation Press, Annual Prize, and Culture Trail.</p>
            <div className="btn-duo">
              <Link className="cta-primary dull" to="/foundation">← Back to Foundation</Link>
            </div>
          </div>
        </article>
      </section>
      <section className="panel light">
        <article>
          <div className="panel-content" style={{ width: "100%" }}>
            <div className="preheading">In development</div>
            <h2 className="H2">Programmes</h2>
            <p>Full programme detail is in development. The Digital Archive is already operational with 215 works catalogued.</p>
          </div>
        </article>
      </section>
    </main>
  );
}
