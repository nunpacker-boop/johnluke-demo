import { Link } from "react-router-dom";
export default function Page() {
  return (
    <main>
      <section className="hero">
        <article>
          <div className="hero-content">
            <div className="preheading">John Luke · Biography</div>
            <h1>Life & Times</h1>
            <p>Born in Duncairn, Belfast in 1906, John Luke spent his life in pursuit of a singular vision — precise, patient, and deeply felt.</p>
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
            <h2 className="H2">Life & Times</h2>
            <p>A full narrative biography is in development, from childhood in north Belfast through his studies at the Slade, his return to Belfast, and his final years painting in Donegal.</p>
          </div>
        </article>
      </section>
    </main>
  );
}
