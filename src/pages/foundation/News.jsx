import { Link } from "react-router-dom";
export default function Page() {
  return (
    <main>
      <section className="hero">
        <article>
          <div className="hero-content">
            <div className="preheading">Foundation · Updates</div>
            <h1>News</h1>
            <p>Foundation news, announcements, and updates.</p>
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
            <h2 className="H2">News</h2>
            <p>News will be published here as the Foundation develops its programmes and partnerships.</p>
          </div>
        </article>
      </section>
    </main>
  );
}
