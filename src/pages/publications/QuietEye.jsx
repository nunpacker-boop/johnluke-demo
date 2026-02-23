import { Link } from "react-router-dom";
export default function Page() {
  return (
    <main>
      <section className="hero">
        <article>
          <div className="hero-content">
            <div className="preheading">Foundation Press · Educational</div>
            <h1>The Quiet Eye: The Mind and Vision of Drawing</h1>
            <p>A study of John Luke's approach to drawing — for educators, art students, and anyone who wants to understand how a great draughtsman looks at the world.</p>
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
            <h2 className="H2">The Quiet Eye: The Mind and Vision of Drawing</h2>
            <p>This spiral-bound educational title is in development. Register your interest to be notified of publication.</p>
          </div>
        </article>
      </section>
    </main>
  );
}
