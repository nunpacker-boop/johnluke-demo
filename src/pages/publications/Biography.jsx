import { Link } from "react-router-dom";
export default function Page() {
  return (
    <main>
      <section className="hero">
        <article>
          <div className="hero-content">
            <div className="preheading">Foundation Press</div>
            <h1>John Luke: A Biography</h1>
            <p>The first full biography of John Luke — from his childhood in Ligoniel to his studies at the Slade, his return to Belfast, and a lifetime of quiet, extraordinary work.</p>
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
            <h2 className="H2">John Luke: A Biography</h2>
            <p>The biography is currently in draft. Register your interest to be notified when pre-orders open.</p>
          </div>
        </article>
      </section>
    </main>
  );
}
