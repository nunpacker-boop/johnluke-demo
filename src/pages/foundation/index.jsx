import { Link } from "react-router-dom";
const cards = [
  { label: "Purpose", title: "About & Mission", body: "What the Foundation exists to do, and why now.", to: "/foundation/about" },
  { label: "Work", title: "Programmes", body: "Digital archive, Foundation Press, Annual Prize, and Culture Trail.", to: "/foundation/programmes" },
  { label: "Governance", title: "Trustees", body: "The Board of Trustees and Advisory Panels.", to: "/foundation/trustees" },
  { label: "Collaboration", title: "Partners", body: "Institutional and organisational partnerships.", to: "/foundation/partners" },
  { label: "Media", title: "Press & Media", body: "Press pack, high-resolution images, and media contact.", to: "/foundation/press" },
  { label: "Updates", title: "News", body: "Foundation news, announcements, and updates.", to: "/foundation/news" },
];
export default function Foundation() {
  return (
    <main>
      <section className="hero">
        <article>
          <div className="hero-content">
            <div className="preheading">Foundation</div>
            <h1>Preserving. Interpreting. Promoting.</h1>
            <p>The John Luke Foundation is being established to address a significant cultural gap — the absence of a dedicated institution for one of Ireland's most distinctive twentieth-century artists.</p>
            <div className="section-subnav">
              <Link to="/foundation/about">About</Link>
              <Link to="/foundation/programmes">Programmes</Link>
              <Link to="/foundation/trustees">Trustees</Link>
              <Link to="/foundation/partners">Partners</Link>
              <Link to="/foundation/press">Press</Link>
              <Link to="/foundation/news">News</Link>
            </div>
          </div>
          <img className="panel-media contain hero-img-small" src="/images/john-luke-pencil-portrait.png" alt="John Luke Foundation" />
        </article>
      </section>
      <section className="panel light">
        <article>
          <div className="panel-content" style={{ width: "100%" }}>
            <div className="preheading">The Foundation</div>
            <h2 className="H2">What we do</h2>
            <div className="card-grid" style={{ marginTop: 16 }}>
              {cards.map(c => (
                <Link key={c.to} className="card light" to={c.to}>
                  <div className="card-label">{c.label}</div>
                  <div className="card-title">{c.title}</div>
                  <p className="card-body">{c.body}</p>
                  <div className="card-cta">Read →</div>
                </Link>
              ))}
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
