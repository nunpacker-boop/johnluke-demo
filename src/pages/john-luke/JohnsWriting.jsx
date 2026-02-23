import { Link } from "react-router-dom";
export default function Page() {
  return (
    <main>
      <section className="hero">
        <article>
          <div className="hero-content">
            <div className="preheading">John Luke · Primary source</div>
            <h1>John's Writing</h1>
            <p>Thousands of words written by John Luke himself — on art, on technique, on vision, on the act of drawing. A primary source of the highest order.</p>
            <div className="btn-duo">
              <Link className="cta-primary dull" to="/john-luke">← Back to John Luke</Link>
            </div>
          </div>
        </article>
      </section>
      <section className="panel light">
        <article>
          <div className="panel-content" style={{ width: "100%" }}>
            <div className="preheading">In development</div>
            <h2 className="H2">John's Writing</h2>
            <p>The first complete publication of Luke's own writing on art, edited and annotated by the Foundation, is in development.</p>
          </div>
        </article>
      </section>
    </main>
  );
}
