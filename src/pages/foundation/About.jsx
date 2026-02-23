import { Link } from "react-router-dom";
export default function Page() {
  return (
    <main>
      <section className="hero">
        <article>
          <div className="hero-content">
            <div className="preheading">Foundation · Purpose</div>
            <h1>About & Mission</h1>
            <p>The John Luke Foundation is established to preserve, interpret, and promote the life and work of John Luke — with publishing, education, and digital heritage programmes to broaden access and scholarship.</p>
            <div className="btn-duo">
              <Link className="cta-primary dull" to="/foundation">← Back to Foundation</Link>
            </div>
          </div>
        </article>
      </section>
      <section className="panel light">
        <article>
          <div className="panel-content" style={{ width: "100%" }}>
            <div className="preheading">In development</div>
            <h2 className="H2">About & Mission</h2>
            <p>A full account of the Foundation's mission, history, and structure is in development.</p>
          </div>
        </article>
      </section>
    </main>
  );
}
