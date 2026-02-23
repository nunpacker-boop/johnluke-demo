import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";

// ── Result card ──────────────────────────────────────────────────────────────
function ArtworkCard({ work }) {
  return (
    <div className="artwork-card">
      <div className="artwork-card-inner">
        <div className="artwork-card-meta">
          {work.raisonneNumber && (
            <span className="artwork-raison">JL-{work.raisonneNumber}</span>
          )}
          {work.attribution && work.attribution !== "Confirmed" && (
            <span className="artwork-attribution">{work.attribution}</span>
          )}
        </div>
        <h3 className="artwork-title">
          {work.title || "Untitled"}
        </h3>
        <div className="artwork-details">
          {work.date && <span>{work.date}</span>}
          {work.medium && <span>{work.medium}</span>}
          {work.dimensions && <span>{work.dimensions}</span>}
        </div>
        {(work.theme || work.period) && (
          <div className="artwork-tags">
            {work.period && <span className="tag">{work.period}</span>}
            {work.theme && <span className="tag">{work.theme}</span>}
            {work.technique && work.technique !== work.medium && (
              <span className="tag">{work.technique}</span>
            )}
          </div>
        )}
        {work.exhibitions?.length > 0 && (
          <div className="artwork-exhibitions">
            <span className="artwork-exhibitions-label">Exhibited: </span>
            {work.exhibitions.filter(Boolean).join(" · ")}
          </div>
        )}
        {work.location && (
          <div className="artwork-location">{work.location}</div>
        )}
      </div>
    </div>
  );
}

// ── Filter pill ──────────────────────────────────────────────────────────────
function FilterPill({ label, value, active, onClick }) {
  return (
    <button
      className={`filter-pill ${active ? "active" : ""}`}
      onClick={() => onClick(value)}
    >
      {label}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const FILTER_TYPES = [
  { label: "All fields", value: "all" },
  { label: "Title", value: "title" },
  { label: "Medium & technique", value: "medium" },
  { label: "Theme & subject", value: "theme" },
  { label: "Period", value: "period" },
  { label: "Exhibition", value: "exhibition" },
];

const QUICK_SEARCHES = [
  { label: "Tempera paintings", q: "tempera", type: "medium" },
  { label: "Landscape works", q: "landscape", type: "theme" },
  { label: "Oil paintings", q: "oil", type: "medium" },
  { label: "Drawings", q: "drawing", type: "medium" },
  { label: "Belfast subjects", q: "belfast", type: "theme" },
  { label: "RUA exhibitions", q: "RUA", type: "exhibition" },
  { label: "CEMA", q: "CEMA", type: "exhibition" },
  { label: "Figure compositions", q: "figure", type: "theme" },
];

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [filterType, setFilterType] = useState(searchParams.get("type") || "all");
  const [dateFrom, setDateFrom] = useState(searchParams.get("from") || "");
  const [dateTo, setDateTo] = useState(searchParams.get("to") || "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [resultCount, setResultCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  // ── Search function ────────────────────────────────────────────────────────
  const doSearch = useCallback(async (q, type, from, to) => {
    if (!q && !from && !to) return;

    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);
    setHasSearched(true);

    // Update URL params
    const params = {};
    if (q) params.q = q;
    if (type !== "all") params.type = type;
    if (from) params.from = from;
    if (to) params.to = to;
    setSearchParams(params, { replace: true });

    try {
      const qs = new URLSearchParams({ q, type, ...(from && { from }), ...(to && { to }) });
      const res = await fetch(`/api/search?${qs}`, {
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setResults(data.results || []);
      setResultCount(data.count || 0);
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [setSearchParams]);

  // ── Run search if URL already has params (e.g. shared link) ───────────────
  useEffect(() => {
    const q = searchParams.get("q");
    const type = searchParams.get("type") || "all";
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (q || from || to) {
      setQuery(q || "");
      setFilterType(type);
      setDateFrom(from || "");
      setDateTo(to || "");
      doSearch(q || "", type, from || "", to || "");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    doSearch(query, filterType, dateFrom, dateTo);
  };

  const handleQuickSearch = ({ q, type }) => {
    setQuery(q);
    setFilterType(type);
    setDateFrom("");
    setDateTo("");
    doSearch(q, type, "", "");
  };

  const handleClear = () => {
    setQuery("");
    setFilterType("all");
    setDateFrom("");
    setDateTo("");
    setResults([]);
    setHasSearched(false);
    setError(null);
    setSearchParams({}, { replace: true });
    inputRef.current?.focus();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main>
      {/* ── Hero / search header ────────────────────────────────────────── */}
      <section className="search-hero">
        <article>
          <div className="search-hero-content">
            <div className="preheading">Works · Browse & Search</div>
            <h1>Search the catalogue</h1>
            <p>
              215 works catalogued across all periods, media, and themes.
              Search by title, technique, subject, period, or exhibition history.
            </p>

            {/* ── Search form ─────────────────────────────────────────── */}
            <form className="search-form" onSubmit={handleSubmit}>
              <div className="search-input-row">
                <input
                  ref={inputRef}
                  className="search-input"
                  type="text"
                  placeholder="Search works — e.g. 'tempera', 'landscape', 'RUA 1945'…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  className="search-submit"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="search-spinner" />
                  ) : (
                    <SearchIcon />
                  )}
                </button>
                {(query || dateFrom || dateTo) && (
                  <button
                    className="search-clear"
                    type="button"
                    onClick={handleClear}
                    aria-label="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* ── Filter type pills ──────────────────────────────────── */}
              <div className="search-filter-row">
                <div className="filter-pills">
                  {FILTER_TYPES.map((f) => (
                    <FilterPill
                      key={f.value}
                      label={f.label}
                      value={f.value}
                      active={filterType === f.value}
                      onClick={setFilterType}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  className="filter-toggle"
                  onClick={() => setShowFilters((s) => !s)}
                >
                  {showFilters ? "Hide date range ↑" : "Filter by date ↓"}
                </button>
              </div>

              {/* ── Date range ──────────────────────────────────────────── */}
              {showFilters && (
                <div className="search-date-row">
                  <label className="date-label">
                    <span>From year</span>
                    <input
                      className="date-input"
                      type="number"
                      placeholder="e.g. 1940"
                      min="1900"
                      max="1980"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                  </label>
                  <span className="date-sep">to</span>
                  <label className="date-label">
                    <span>To year</span>
                    <input
                      className="date-input"
                      type="number"
                      placeholder="e.g. 1960"
                      min="1900"
                      max="1980"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                    />
                  </label>
                  <button
                    type="submit"
                    className="cta-primary"
                    style={{ marginLeft: "auto" }}
                  >
                    Apply
                  </button>
                </div>
              )}
            </form>

            {/* ── Quick searches ─────────────────────────────────────────── */}
            {!hasSearched && (
              <div className="quick-searches">
                <span className="quick-searches-label">Try:</span>
                {QUICK_SEARCHES.map((qs) => (
                  <button
                    key={qs.q + qs.type}
                    className="quick-search-btn"
                    type="button"
                    onClick={() => handleQuickSearch(qs)}
                  >
                    {qs.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </article>
      </section>

      {/* ── Results area ────────────────────────────────────────────────── */}
      <section className="panel light search-results-panel">
        <article>
          <div style={{ width: "100%" }}>

            {/* Loading */}
            {loading && (
              <div className="search-state">
                <div className="search-loading-bar">
                  <div className="search-loading-fill" />
                </div>
                <p>Searching the catalogue…</p>
              </div>
            )}

            {/* Error */}
            {error && !loading && (
              <div className="search-state search-error">
                <p>
                  <strong>Search unavailable.</strong> {error}
                </p>
                <p style={{ marginTop: 6, fontSize: "0.875rem", opacity: 0.7 }}>
                  The database connection may not yet be configured.
                  See setup instructions below.
                </p>
              </div>
            )}

            {/* Results header */}
            {hasSearched && !loading && !error && (
              <div className="results-header">
                <span className="results-count">
                  {resultCount === 0
                    ? "No results"
                    : `${resultCount} work${resultCount !== 1 ? "s" : ""}`}
                </span>
                {query && (
                  <span className="results-query">
                    for <strong>"{query}"</strong>
                    {filterType !== "all" && (
                      <> in <strong>{FILTER_TYPES.find(f => f.value === filterType)?.label}</strong></>
                    )}
                  </span>
                )}
                {resultCount === 60 && (
                  <span className="results-capped">
                    (showing first 60 — refine your search to narrow down)
                  </span>
                )}
              </div>
            )}

            {/* No results */}
            {hasSearched && !loading && !error && resultCount === 0 && (
              <div className="search-state">
                <p>No works found matching your search.</p>
                <p style={{ marginTop: 6, fontSize: "0.875rem", opacity: 0.7 }}>
                  Try a broader term, or use a different filter type.
                </p>
                <div className="quick-searches" style={{ marginTop: 16 }}>
                  <span className="quick-searches-label">Try instead:</span>
                  {QUICK_SEARCHES.slice(0, 4).map((qs) => (
                    <button
                      key={qs.q}
                      className="quick-search-btn"
                      onClick={() => handleQuickSearch(qs)}
                    >
                      {qs.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Results grid */}
            {!loading && results.length > 0 && (
              <div className="artwork-grid">
                {results.map((work, i) => (
                  <ArtworkCard key={`${work.raisonneNumber || i}-${work.title}`} work={work} />
                ))}
              </div>
            )}

            {/* Empty state — before first search */}
            {!hasSearched && !loading && (
              <div className="search-empty-state">
                <div className="search-empty-icon">◎</div>
                <p>215 works across all periods, media, and themes.</p>
                <p>Enter a search term above to begin exploring.</p>
              </div>
            )}

          </div>
        </article>
      </section>

      {/* ── Setup instructions (shown only in dev / when error) ─────────── */}
      {error && (
        <section className="panel dim">
          <article>
            <div className="panel-content" style={{ width: "100%" }}>
              <div className="preheading">Setup required</div>
              <h2 className="H2">Connecting to Neo4j Aura</h2>
              <p>
                Add these three environment variables in{" "}
                <strong>Cloudflare Pages → Settings → Environment Variables</strong>:
              </p>
              <div className="setup-code">
                <div><span className="code-key">NEO4J_URI</span><span className="code-val">https://xxxxxxxx.databases.neo4j.io</span></div>
                <div><span className="code-key">NEO4J_USER</span><span className="code-val">neo4j</span></div>
                <div><span className="code-key">NEO4J_PASSWORD</span><span className="code-val">your-password</span></div>
              </div>
              <p style={{ marginTop: 12, fontSize: "0.9rem", opacity: 0.7 }}>
                Your Connection URI is in the Aura console under Instances. Replace{" "}
                <code>neo4j+s://</code> with <code>https://</code>.
              </p>
            </div>
          </article>
        </section>
      )}

      <style>{`
        /* ── Search hero ─────────────────────────────────────────────────── */
        .search-hero {
          background: var(--shadow);
          color: var(--white);
          padding: 60px 0 50px;
        }
        .search-hero article {
          max-width: var(--cw);
          margin: 0 auto;
          padding: 0 var(--cp);
        }
        .search-hero-content {
          max-width: 760px;
        }
        .search-hero h1 {
          font-size: clamp(2rem, 4vw, 2.8rem);
          margin: 8px 0 12px;
        }
        .search-hero p {
          opacity: 0.8;
          margin-bottom: 28px;
          font-size: 1.05rem;
        }

        /* ── Search form ─────────────────────────────────────────────────── */
        .search-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .search-input-row {
          display: flex;
          align-items: center;
          gap: 8px;
          background: white;
          border-radius: 0.35rem;
          padding: 4px 4px 4px 16px;
        }
        .search-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 1rem;
          color: var(--shadow);
          background: transparent;
          padding: 10px 0;
          font-family: var(--ff-body);
        }
        .search-input::placeholder { opacity: 0.45; color: var(--shadow); }
        .search-submit {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          border-radius: 0.25rem;
          background: var(--primary);
          border: none;
          cursor: pointer;
          color: white;
          flex-shrink: 0;
          transition: background 0.15s;
        }
        .search-submit:hover { background: var(--accent); }
        .search-submit:disabled { opacity: 0.6; cursor: wait; }
        .search-clear {
          background: none;
          border: none;
          color: var(--shadow);
          opacity: 0.4;
          cursor: pointer;
          font-size: 0.85rem;
          padding: 4px 8px;
        }
        .search-clear:hover { opacity: 0.7; }

        /* ── Filter pills ────────────────────────────────────────────────── */
        .search-filter-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .filter-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          flex: 1;
        }
        .filter-pill {
          padding: 5px 14px;
          border-radius: 2rem;
          border: 1px solid rgba(255,255,255,0.25);
          background: transparent;
          color: white;
          font-size: 0.82rem;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .filter-pill:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.5);
        }
        .filter-pill.active {
          background: white;
          color: var(--shadow);
          border-color: white;
          font-weight: 600;
        }
        .filter-toggle {
          background: none;
          border: none;
          color: rgba(255,255,255,0.6);
          font-size: 0.82rem;
          cursor: pointer;
          white-space: nowrap;
          padding: 0;
        }
        .filter-toggle:hover { color: white; }

        /* ── Date range ──────────────────────────────────────────────────── */
        .search-date-row {
          display: flex;
          align-items: flex-end;
          gap: 12px;
          flex-wrap: wrap;
          background: rgba(255,255,255,0.08);
          border-radius: 0.35rem;
          padding: 14px 16px;
        }
        .date-label {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 0.8rem;
          opacity: 0.7;
        }
        .date-input {
          width: 110px;
          padding: 7px 10px;
          border-radius: 0.25rem;
          border: 1px solid rgba(255,255,255,0.3);
          background: rgba(255,255,255,0.1);
          color: white;
          font-size: 0.95rem;
          font-family: var(--ff-body);
        }
        .date-input::placeholder { opacity: 0.5; }
        .date-sep { color: rgba(255,255,255,0.5); align-self: flex-end; padding-bottom: 8px; }

        /* ── Quick searches ───────────────────────────────────────────────── */
        .quick-searches {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          margin-top: 16px;
        }
        .quick-searches-label {
          font-size: 0.82rem;
          opacity: 0.5;
        }
        .quick-search-btn {
          padding: 4px 13px;
          border-radius: 2rem;
          border: 1px solid rgba(255,255,255,0.2);
          background: transparent;
          color: rgba(255,255,255,0.8);
          font-size: 0.82rem;
          cursor: pointer;
          transition: all 0.15s;
        }
        .quick-search-btn:hover {
          background: rgba(255,255,255,0.1);
          color: white;
          border-color: rgba(255,255,255,0.4);
        }

        /* ── Loading ─────────────────────────────────────────────────────── */
        .search-loading-bar {
          width: 200px;
          height: 3px;
          background: var(--light);
          border-radius: 2px;
          overflow: hidden;
          margin: 0 auto 12px;
        }
        .search-loading-fill {
          height: 100%;
          background: var(--primary);
          border-radius: 2px;
          animation: loadingSlide 1.2s ease-in-out infinite;
        }
        @keyframes loadingSlide {
          0%   { width: 0%; margin-left: 0%; }
          50%  { width: 60%; margin-left: 20%; }
          100% { width: 0%; margin-left: 100%; }
        }
        .search-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── States ──────────────────────────────────────────────────────── */
        .search-state {
          text-align: center;
          padding: 40px 20px;
          color: var(--shadow);
          opacity: 0.6;
        }
        .search-error {
          background: #fff0f0;
          border-radius: 0.35rem;
          padding: 20px;
          text-align: left;
          opacity: 1;
          color: #a00;
        }
        .search-empty-state {
          text-align: center;
          padding: 60px 20px;
          color: var(--shadow);
          opacity: 0.4;
        }
        .search-empty-icon {
          font-size: 3rem;
          margin-bottom: 12px;
        }

        /* ── Results header ──────────────────────────────────────────────── */
        .search-results-panel article > div {
          padding: 30px 0;
        }
        .results-header {
          display: flex;
          align-items: baseline;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--light);
          color: var(--shadow);
        }
        .results-count {
          font-weight: 700;
          font-size: 1.1rem;
        }
        .results-query { opacity: 0.65; font-size: 0.9rem; }
        .results-capped { opacity: 0.45; font-size: 0.8rem; }

        /* ── Artwork grid ────────────────────────────────────────────────── */
        .artwork-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }
        @media (max-width: 960px) {
          .artwork-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 580px) {
          .artwork-grid { grid-template-columns: 1fr; }
        }

        /* ── Artwork card ────────────────────────────────────────────────── */
        .artwork-card {
          background: white;
          border: 1px solid var(--light);
          border-radius: 0.3rem;
          transition: box-shadow 0.15s, border-color 0.15s;
        }
        .artwork-card:hover {
          box-shadow: 0 4px 16px rgba(4,36,54,0.1);
          border-color: var(--mid, #aac);
        }
        .artwork-card-inner {
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .artwork-card-meta {
          display: flex;
          gap: 8px;
          align-items: center;
          min-height: 18px;
        }
        .artwork-raison {
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: var(--primary);
          font-family: monospace;
        }
        .artwork-attribution {
          font-size: 0.7rem;
          background: #fff3cd;
          color: #856404;
          padding: 1px 7px;
          border-radius: 2rem;
          font-weight: 600;
        }
        .artwork-title {
          font-family: var(--ff-hx);
          font-size: 1rem;
          font-weight: 500;
          color: var(--shadow);
          line-height: 1.3;
          margin: 0;
        }
        .artwork-details {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          font-size: 0.8rem;
          color: var(--shadow);
          opacity: 0.6;
        }
        .artwork-details span::after {
          content: "·";
          margin-left: 6px;
          opacity: 0.4;
        }
        .artwork-details span:last-child::after { content: ""; }
        .artwork-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          margin-top: 4px;
        }
        .tag {
          font-size: 0.72rem;
          padding: 2px 8px;
          background: var(--light);
          color: var(--shadow);
          border-radius: 2rem;
          opacity: 0.8;
        }
        .artwork-exhibitions {
          font-size: 0.78rem;
          color: var(--shadow);
          opacity: 0.55;
          margin-top: 4px;
          line-height: 1.4;
        }
        .artwork-exhibitions-label { font-weight: 600; }
        .artwork-location {
          font-size: 0.75rem;
          color: var(--shadow);
          opacity: 0.4;
          font-style: italic;
        }

        /* ── Setup instructions ──────────────────────────────────────────── */
        .setup-code {
          background: rgba(255,255,255,0.08);
          border-radius: 0.3rem;
          padding: 14px 18px;
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-family: monospace;
          font-size: 0.9rem;
        }
        .code-key {
          color: var(--primary, #6cf);
          margin-right: 16px;
          display: inline-block;
          min-width: 160px;
        }
        .code-val { opacity: 0.7; }
      `}</style>
    </main>
  );
}

// ── Icon ──────────────────────────────────────────────────────────────────────
function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
