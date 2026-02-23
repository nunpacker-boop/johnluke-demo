import { useParams, Link } from "react-router-dom";
export default function WritingPost() {
  const { slug } = useParams();
  return (
    <main>
      <section className="panel light">
        <article>
          <div className="panel-content" style={{ width: "100%" }}>
            <Link to="/writing" style={{ fontSize: "0.875rem", opacity: 0.6 }}>← All Writing</Link>
            <div className="preheading" style={{ marginTop: 16 }}>Foundation Writing</div>
            <h1>Post not yet published</h1>
            <p>This essay is in preparation. Return soon.</p>
          </div>
        </article>
      </section>
    </main>
  );
}
