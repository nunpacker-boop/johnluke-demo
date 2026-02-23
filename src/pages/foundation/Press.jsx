import { Link } from "react-router-dom";
export default function Page() {
  return (
    <main>
      <section className="hero">
        <article>
          <div className="hero-content">
            <div className="preheading">Foundation · Media</div>
            <h1>Press & Media</h1>
            <p>Press information, high-resolution images, briefing documents, and media contact.</p>
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
            <h2 className="H2">Press & Media</h2>
            <p>A full press pack including high-resolution images and a Foundation briefing document is in preparation. For urgent media enquiries, contact info@johnluke.art.</p>
          </div>
        </article>
      </section>
    </main>
  );
}
