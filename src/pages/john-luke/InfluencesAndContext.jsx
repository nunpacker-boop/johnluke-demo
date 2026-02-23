import { Link } from "react-router-dom";
export default function Page() {
  return (
    <main>
      <section className="hero">
        <article>
          <div className="hero-content">
            <div className="preheading">John Luke · Ideas</div>
            <h1>Influences & Context</h1>
            <p>The intellectual and artistic world that shaped John Luke — and how his work responded to and departed from it.</p>
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
            <h2 className="H2">Influences & Context</h2>
            <p>Essays on Luke's relationship to European modernism, the Belfast art world, and the specific books and artists that influenced his thinking are in development.</p>
          </div>
        </article>
      </section>
    </main>
  );
}
