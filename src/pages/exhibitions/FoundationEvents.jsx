import { Link } from "react-router-dom";
export default function Page() {
  return (
    <main>
      <section className="hero">
        <article>
          <div className="hero-content">
            <div className="preheading">Exhibitions · Events</div>
            <h1>Foundation Events</h1>
            <p>Exhibitions, talks, and events organised by the John Luke Foundation.</p>
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
            <h2 className="H2">Foundation Events</h2>
            <p>The Foundation has not yet announced public events. Details will be published here as programmes develop.</p>
          </div>
        </article>
      </section>
    </main>
  );
}
