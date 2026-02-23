import { Link } from "react-router-dom";
export default function Page() {
  return (
    <main>
      <section className="hero">
        <article>
          <div className="hero-content">
            <div className="preheading">John Luke · Practice</div>
            <h1>Technique & Method</h1>
            <p>Luke's mastery of egg tempera set him apart from his contemporaries — a technique requiring exceptional discipline that he made entirely his own.</p>
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
            <h2 className="H2">Technique & Method</h2>
            <p>A full account of Luke's materials and methods is in development, drawn from his own notes and writings, with reference to the physical examination of surviving works.</p>
          </div>
        </article>
      </section>
    </main>
  );
}
