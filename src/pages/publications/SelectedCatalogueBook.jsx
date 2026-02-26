import { Link } from "react-router-dom";
export default function Page() {
  return (
    <main>
      <section className="hero">
        <article>
          <div className="hero-content">
            <div className="preheading">Foundation Press · Catalogue</div>
            <h1>The Selected Catalogue</h1>
            <p>A large-format hardback presenting approximately fifty key works with museum-quality reproduction and deep scholarly commentary.</p>
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
            <h2 className="H2">The Selected Catalogue</h2>
            <p>The Selected Catalogue is the Foundation's prestige publication. Register your interest to be notified when pre-orders open.</p>
          </div>
        </article>
      </section>
    </main>
  );
}
