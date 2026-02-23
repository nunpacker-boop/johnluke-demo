import { Link } from "react-router-dom";
export default function Page() {
  return (
    <main>
      <section className="hero">
        <article>
          <div className="hero-content">
            <div className="preheading">Contact · Collectors</div>
            <h1>Register a Work</h1>
            <p>If you own a work by John Luke — or believe you might — the Foundation offers a fully confidential registration and verification service. Your identity and the location of any work will never be published without your explicit written consent.</p>
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
            <h2 className="H2">Register a Work</h2>
            <p>The online registration form is in development. For now, please contact us directly at info@johnluke.art with a photograph and any information you have about the work.</p>
          </div>
        </article>
      </section>
    </main>
  );
}
