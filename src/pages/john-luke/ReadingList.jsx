import { Link } from "react-router-dom";
export default function Page() {
  return (
    <main>
      <section className="hero">
        <article>
          <div className="hero-content">
            <div className="preheading">John Luke · Intellectual life</div>
            <h1>Reading List</h1>
            <p>The books John Luke read, owned, and annotated — a window into the mind behind the paintings.</p>
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
            <h2 className="H2">Reading List</h2>
            <p>A fully annotated reading list with context on how each book influenced Luke's thinking and practice is in development.</p>
          </div>
        </article>
      </section>
    </main>
  );
}
