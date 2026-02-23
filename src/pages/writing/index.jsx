import { Link } from "react-router-dom";
export default function Writing() {
  return (
    <main>
      <section className="hero">
        <article>
          <div className="hero-content">
            <div className="preheading">Foundation Writing</div>
            <h1>Long-form essays on John Luke and his world</h1>
            <p>Deep, careful writing about individual works, discoveries, technique, biography, and context. No comments. No noise. Just sustained attention to an extraordinary artist.</p>
          </div>
        </article>
      </section>
      <section className="panel light">
        <article>
          <div className="panel-content" style={{ width: "100%" }}>
            <div className="preheading">Coming soon</div>
            <h2 className="H2">Essays in preparation</h2>
            <p>The Writing section will publish long-form Foundation essays on John Luke's artworks, stories, technique, and research. The first posts are in preparation.</p>
            <p style={{ marginTop: "1rem" }}>Each post will reference catalogue entries and archive records directly — the writing and the archive will work together as a single research environment.</p>
          </div>
        </article>
      </section>
    </main>
  );
}
