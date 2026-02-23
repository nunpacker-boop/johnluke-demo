import { Link } from "react-router-dom";
export default function Page() {
  return (
    <main>
      <section className="hero">
        <article>
          <div className="hero-content">
            <div className="preheading">Archive · Photography</div>
            <h1>Photographs</h1>
            <p>Documentary photographs of John Luke, his studio, his working environment, and contemporary images of works in situ.</p>
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
            <h2 className="H2">Photographs</h2>
            <p>The Photographs collection is being digitised and catalogued. Records will be published progressively.</p>
          </div>
        </article>
      </section>
    </main>
  );
}
