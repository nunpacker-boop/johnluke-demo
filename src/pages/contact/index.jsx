import { Link } from "react-router-dom";
const cards = [
  { label: "General", title: "General Enquiry", body: "Questions, suggestions, and general correspondence.", to: "/contact", email: "info@johnluke.art" },
  { label: "Collectors & owners", title: "Register a Work", body: "Confidential registration and verification for works in private hands.", to: "/contact/register-a-work" },
  { label: "Researchers", title: "Archive Access", body: "Apply to access restricted archive material, request high-resolution images.", to: "/contact/archive-access" },
  { label: "Press & broadcast", title: "Media Enquiry", body: "Interviews, images, briefings, and broadcast requests.", to: "/contact/media" },
  { label: "Trustees & funders", title: "Partnership & Trusteeship", body: "Discuss involvement as a trustee, donor, or institutional partner.", to: "/contact/partnership" },
];
export default function Contact() {
  return (
    <main>
      <section className="hero">
        <article>
          <div className="hero-content">
            <div className="preheading">Contact</div>
            <h1>Get in touch</h1>
            <p>Use the route most appropriate to your enquiry. All messages are read and responded to by the Foundation team.</p>
            <a className="cta-primary" href="mailto:info@johnluke.art">info@johnluke.art</a>
          </div>
        </article>
      </section>
      <section className="panel light">
        <article>
          <div className="panel-content" style={{ width: "100%" }}>
            <div className="preheading">Contact routes</div>
            <h2 className="H2">Choose the right route</h2>
            <div className="card-grid" style={{ marginTop: 16 }}>
              {cards.map(c => (
                <Link key={c.to} className="card light" to={c.to}>
                  <div className="card-label">{c.label}</div>
                  <div className="card-title">{c.title}</div>
                  <p className="card-body">{c.body}</p>
                  <div className="card-cta">Go →</div>
                </Link>
              ))}
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
