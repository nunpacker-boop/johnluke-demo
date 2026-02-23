import { Link } from "react-router-dom";
export default function Page() {
  return (
    <main>
      <section className="hero">
        <article>
          <div className="hero-content">
            <div className="preheading">Contact · Researchers</div>
            <h1>Archive Access</h1>
            <p>Researchers, institutions, and publishers may apply to access restricted archive material, request high-resolution image files, or arrange to view original documents.</p>
            <div className="btn-duo">
              <Link className="cta-primary dull" to="/contact">← Back to Contact</Link>
            </div>
          </div>
        </article>
      </section>
      <section className="panel light">
        <article>
          <div className="panel-content" style={{ width: "100%" }}>
            <div className="preheading">In development</div>
            <h2 className="H2">Archive Access</h2>
            <p>The online access request form is in development. For now, please contact us directly at info@johnluke.art with details of your research and what you need.</p>
          </div>
        </article>
      </section>
    </main>
  );
}
