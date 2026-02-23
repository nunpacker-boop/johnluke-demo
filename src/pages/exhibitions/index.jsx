import { Link } from "react-router-dom";
export default function Exhibitions() {
  return (
    <main>
      <section className="hero">
        <article>
          <div className="hero-content">
            <div className="preheading">Exhibitions</div>
            <h1>The full exhibition record</h1>
            <p>Fourteen exhibitions between 1935 and 1975 — RUA annuals, CEMA festivals, and posthumous retrospectives — with works shown, venue records, and catalogue references.</p>
            <div className="section-subnav">
              <Link to="/exhibitions/historical">Historical Exhibitions</Link>
              <Link to="/exhibitions/events">Foundation Events</Link>
            </div>
          </div>
        </article>
      </section>
      <section className="panel light">
        <article>
          <div className="panel-content" style={{ width: "100%" }}>
            <div className="preheading">Collections</div>
            <h2 className="H2">Exhibition records</h2>
            <div className="card-grid cols-2" style={{ marginTop: 16 }}>
              <Link className="card light" to="/exhibitions/historical">
                <div className="card-label">1935–1975</div>
                <div className="card-title">Historical Exhibitions</div>
                <p className="card-body">Every exhibition Luke participated in during his lifetime and in the years following his death — with works shown, venues, and catalogue numbers.</p>
                <div className="card-cta">Browse →</div>
              </Link>
              <Link className="card light" to="/exhibitions/events">
                <div className="card-label">Foundation programme</div>
                <div className="card-title">Foundation Events</div>
                <p className="card-body">Exhibitions, talks, and events organised by the John Luke Foundation.</p>
                <div className="card-cta">View events →</div>
              </Link>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
