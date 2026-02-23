import { Link } from "react-router-dom";
export default function Page() {
  return (
    <main>
      <section className="hero">
        <article>
          <div className="hero-content">
            <div className="preheading">Contact · Media</div>
            <h1>Media Enquiry</h1>
            <p>For interview requests, image licensing, broadcast permissions, and press briefings. We aim to respond to media enquiries within 24 hours.</p>
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
            <h2 className="H2">Media Enquiry</h2>
            <p>Please contact info@johnluke.art with your brief, deadline, and requirements. A press pack with high-resolution images and background material is in preparation.</p>
          </div>
        </article>
      </section>
    </main>
  );
}
