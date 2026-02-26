import { Link } from "react-router-dom";
export default function Page() {
  return (
    <main>
      <section className="hero">
        <article>
          <div className="hero-content">
            <div className="preheading">John Luke · Genealogy</div>
            <h1>Family Tree</h1>
            <p>The Luke family from Ahoghill — the world John came from and the people who shaped his earliest years.</p>
            <div className="btn-duo">
              <Link className="cta-primary dull" to="/john-luke">← Back to John Luke</Link>
            </div>
          </div>
        </article>
      </section>
      <section className="panel light">
        <article>
          <div className="panel-content" style={{ width: "100%" }}>
            <div className="preheading">In development</div>
            <h2 className="H2">Family Tree</h2>
            <p>A fully researched family tree with biographical notes on key figures in John Luke's personal history is in development.</p>
          </div>
        </article>
      </section>
    </main>
  );
}
