import { Link } from "react-router-dom";
export default function Page() {
  return (
    <main>
      <section className="hero">
        <article>
          <div className="hero-content">
            <div className="preheading">Foundation · Collaboration</div>
            <h1>Partners</h1>
            <p>Institutional and organisational partnerships supporting the Foundation's mission.</p>
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
            <h2 className="H2">Partners</h2>
            <p>Partnership information will be published as formal agreements are established.</p>
          </div>
        </article>
      </section>
    </main>
  );
}
