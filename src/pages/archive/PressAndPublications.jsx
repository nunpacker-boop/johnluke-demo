import { Link } from "react-router-dom";
export default function Page() {
  return (
    <main>
      <section className="hero">
        <article>
          <div className="hero-content">
            <div className="preheading">Archive · Critical record</div>
            <h1>Press & Publications</h1>
            <p>Newspaper reviews, magazine articles, exhibition catalogues, and other contemporary published writing about John Luke's work.</p>
            <div className="btn-duo">
              <Link className="cta-primary dull" to="/archive">← Back to Archive</Link>
            </div>
          </div>
        </article>
      </section>
      <section className="panel light">
        <article>
          <div className="panel-content" style={{ width: "100%" }}>
            <div className="preheading">In development</div>
            <h2 className="H2">Press & Publications</h2>
            <p>The Press & Publications collection is being catalogued. Published items will be accompanied by transcriptions.</p>
          </div>
        </article>
      </section>
    </main>
  );
}
