import { Link } from "react-router-dom";
const cards = [
  { label: "Biography", title: "Life & Times", body: "Born in Ligoniel, 1906. A life devoted to looking, drawing, and painting with extraordinary precision and patience.", to: "/john-luke/life-and-times" },
  { label: "Practice", title: "Technique & Method", body: "Luke's mastery of egg tempera — a technique demanding rare discipline — and his approach to drawing from life.", to: "/john-luke/technique-and-method" },
  { label: "Ideas", title: "Influences & Context", body: "The books he read, the artists he studied, and how Irish modernism shaped and was shaped by his work.", to: "/john-luke/influences-and-context" },
  { label: "Primary source", title: "John's Writing", body: "Thousands of words of Luke's own writing on art, technique, and vision — never before published in full.", to: "/john-luke/johns-writing" },
  { label: "Intellectual life", title: "Reading List", body: "The books John Luke read and annotated — from Cézanne's letters to Berenson on drawing.", to: "/john-luke/reading-list" },
  { label: "Genealogy", title: "Family Tree", body: "The Luke family from Ligoniel — context for understanding the world he came from.", to: "/john-luke/family-tree" },
];
const links = ["/john-luke/life-and-times", "/john-luke/technique-and-method", "/john-luke/influences-and-context", "/john-luke/johns-writing", "/john-luke/reading-list", "/john-luke/family-tree"];
const linkLabels = ["Life & Times", "Technique & Method", "Influences & Context", "John's Writing", "Reading List", "Family Tree"];
export default function JohnLuke() {
  return (
    <main>
      <section className="hero">
        <article>
          <div className="hero-content">
            <div className="preheading">John Luke · 1906–1975</div>
            <h1>The artist, the work, the thinking</h1>
            <p>John Luke was one of the most distinctive painters of twentieth-century Ireland — a master draughtsman and a pioneer of egg tempera whose disciplined vision produced a body of work unlike any other.</p>
            <div className="section-subnav">
              {links.map((to, i) => <Link key={to} to={to}>{linkLabels[i]}</Link>)}
            </div>
          </div>
          <img className="panel-media contain hero-img-small" src="/images/john-luke-pencil-portrait.png" alt="John Luke" />
        </article>
      </section>
      <section className="panel light">
        <article>
          <div className="panel-content" style={{ width: "100%" }}>
            <div className="preheading">Explore</div>
            <h2 className="H2">Six ways into John Luke's world</h2>
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
