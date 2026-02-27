import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";

// ── Constants ──────────────────────────────────────────────────────────────────
const PX_PER_YEAR    = 680;
const START_YEAR     = 1867;
const END_YEAR       = 1976;
const CANVAS_PADDING = 800;
const CANVAS_WIDTH   = (END_YEAR - START_YEAR) * PX_PER_YEAR + CANVAS_PADDING * 2;
const AXIS_Y         = 500;
const VIEWPORT_PAD   = 1000;

// Vertical swim lanes
const LANE = {
  ARTWORK:       80,   // artworks float high
  LETTER:        200,  // letters just above axis
  EVENT_ABOVE:   320,  // John/family events above axis
  EVENT_JAMES:   600,  // James diary entries below axis
};

function yearToX(year) {
  return CANVAS_PADDING + (year - START_YEAR) * PX_PER_YEAR;
}
function xToYear(x) {
  return START_YEAR + (x - CANVAS_PADDING) / PX_PER_YEAR;
}

function useViewportFade(x, scrollX, viewportW) {
  const centreX   = scrollX + viewportW / 2;
  const dist      = Math.abs(x - centreX);
  const fadeStart = viewportW * 0.38;
  const fadeEnd   = viewportW * 0.68;
  return dist < fadeStart ? 1 : dist > fadeEnd ? 0 : 1 - (dist - fadeStart) / (fadeEnd - fadeStart);
}

// ── Subject colour palette ─────────────────────────────────────────────────────
const SUBJECT_COLOUR = {
  "John Luke":   "#c8a96e",   // warm gold
  "James Luke":  "#7eb8c4",   // steel blue
  "Luke family": "#a09080",   // muted terracotta
};

// ── Year tick marks ─────────────────────────────────────────────────────────────
function YearAxis({ scrollX, viewportW }) {
  const firstYear = Math.max(START_YEAR, Math.floor(xToYear(scrollX - 200)));
  const lastYear  = Math.min(END_YEAR,   Math.ceil(xToYear(scrollX + viewportW + 200)));
  const ticks = [];
  for (let y = Math.ceil(firstYear / 5) * 5; y <= lastYear; y += 5) {
    const x    = yearToX(y);
    const isMajor = y % 10 === 0;
    ticks.push(
      <g key={y} transform={`translate(${x},0)`}>
        <line y1={-6} y2={isMajor ? -16 : -10} stroke={isMajor ? "#c8a96e" : "#444"} strokeWidth={isMajor ? 1.5 : 1}/>
        {isMajor && (
          <text y={-24} textAnchor="middle" fill="#888" fontSize="11" fontFamily="'Cormorant Garamond', serif" letterSpacing="1">
            {y}
          </text>
        )}
      </g>
    );
  }
  return (
    <g transform={`translate(0,${AXIS_Y})`}>
      <line x1={0} x2={CANVAS_WIDTH} stroke="#333" strokeWidth={1}/>
      {ticks}
    </g>
  );
}

// ── Decade band backgrounds ────────────────────────────────────────────────────
function DecadeBands() {
  const bands = [];
  for (let decade = Math.floor(START_YEAR / 10) * 10; decade <= END_YEAR; decade += 10) {
    const x = yearToX(decade);
    const w = PX_PER_YEAR * 10;
    const even = ((decade / 10) % 2 === 0);
    bands.push(
      <rect key={decade} x={x} y={0} width={w} height={AXIS_Y + 200}
        fill={even ? "rgba(255,255,255,0.012)" : "rgba(0,0,0,0.0)"} />
    );
  }
  return <>{bands}</>;
}

// ── Life Event marker ──────────────────────────────────────────────────────────
function EventMarker({ event, scrollX, viewportW, onClick, offsetIndex }) {
  const x      = yearToX(event.year) + (event.month ? ((event.month - 1) / 12) * PX_PER_YEAR : 0);
  const opacity = useViewportFade(x, scrollX, viewportW);
  if (opacity < 0.02) return null;

  const isJames  = event.subject === "James Luke";
  const isMajor  = event.significance === "major";
  const colour   = SUBJECT_COLOUR[event.subject] || "#888";

  // Stagger same-year events vertically
  const baseY    = isJames ? LANE.EVENT_JAMES : LANE.EVENT_ABOVE;
  const staggerY = isJames
    ? baseY + (offsetIndex % 3) * 24
    : baseY - (offsetIndex % 3) * 22;

  const lineY1   = isJames ? AXIS_Y + 6 : AXIS_Y - 6;
  const lineY2   = staggerY + (isJames ? -8 : 28);

  return (
    <g style={{ opacity, cursor: "pointer" }} onClick={() => onClick(event)}>
      {/* Stem */}
      <line x1={x} y1={lineY1} x2={x} y2={lineY2}
        stroke={colour} strokeWidth={isMajor ? 1.5 : 0.8}
        strokeDasharray={isMajor ? "none" : "3,3"}
        opacity={0.5}/>
      {/* Dot on axis */}
      <circle cx={x} cy={AXIS_Y} r={isMajor ? 4 : 2.5}
        fill={isMajor ? colour : "transparent"}
        stroke={colour} strokeWidth={isMajor ? 0 : 1}/>
      {/* Label */}
      <foreignObject
        x={x - 110} y={isJames ? staggerY : staggerY - 52}
        width={220} height={60}
        style={{ overflow: "visible" }}>
        <div
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: isMajor ? "11px" : "10px",
            color: isMajor ? colour : "#666",
            lineHeight: 1.35,
            textAlign: "center",
            pointerEvents: "none",
            textShadow: "0 1px 6px rgba(0,0,0,0.9)",
          }}>
          {isMajor && (
            <div style={{ fontSize: "9px", letterSpacing: "1.5px", opacity: 0.7,
              textTransform: "uppercase", marginBottom: 2 }}>
              {event.subject === "James Luke" ? "James" : event.dateLabel}
            </div>
          )}
          <div style={{ fontWeight: isMajor ? 600 : 400 }}>
            {event.text.length > 70 ? event.text.slice(0, 68) + "…" : event.text}
          </div>
        </div>
      </foreignObject>
    </g>
  );
}

// ── Letter marker ──────────────────────────────────────────────────────────────
function LetterMarker({ artefact, scrollX, viewportW, onClick, offsetIndex }) {
  const x = yearToX(artefact.year)
    + (artefact.month ? ((artefact.month - 1) / 12) * PX_PER_YEAR : 0)
    + (artefact.day   ? ((artefact.day - 1) / 31) * (PX_PER_YEAR / 12) : 0)
    + (offsetIndex * 28) - 14;

  const opacity = useViewportFade(x, scrollX, viewportW);
  if (opacity < 0.02) return null;

  const hasArtworks = artefact.mentionedArtworks?.length > 0;
  const isLong      = artefact.wordCount > 1000;

  return (
    <g style={{ opacity, cursor: "pointer" }} onClick={() => onClick(artefact)}>
      {/* Stem */}
      <line x1={x} y1={AXIS_Y - 6} x2={x} y2={LANE.LETTER + 52}
        stroke="#c8a96e" strokeWidth={0.8} opacity={0.4}/>
      {/* Envelope icon */}
      <g transform={`translate(${x - 14}, ${LANE.LETTER})`}>
        <rect width={28} height={19} rx={2}
          fill="rgba(200,169,110,0.08)" stroke="#c8a96e"
          strokeWidth={hasArtworks ? 1.5 : 1}
          opacity={0.85}/>
        {/* Envelope flap */}
        <polyline points="0,0 14,11 28,0" fill="none" stroke="#c8a96e" strokeWidth={0.8} opacity={0.7}/>
        {/* Art link indicator */}
        {hasArtworks && (
          <circle cx={24} cy={4} r={3} fill="#c8a96e" opacity={0.9}/>
        )}
        {/* Long letter indicator */}
        {isLong && (
          <line x1={4} y1={14} x2={24} y2={14} stroke="#c8a96e" strokeWidth={0.8} opacity={0.5}/>
        )}
      </g>
      {/* Recipient label */}
      <text x={x} y={LANE.LETTER + 30} textAnchor="middle"
        fill="#8a7550" fontSize="8.5" fontFamily="'Cormorant Garamond', serif"
        style={{ pointerEvents: "none" }}>
        {artefact.recipient === "John Hewitt" ? "Hewitt" :
         artefact.recipient === "Nevill Johnson" ? "Johnson" :
         artefact.recipient === "Patric Stevenson" ? "Stevenson" : artefact.recipient}
      </text>
    </g>
  );
}

// ── Artwork thumbnail on canvas ────────────────────────────────────────────────
function ArtworkMarker({ work, scrollX, viewportW, onClick, offsetIndex }) {
  const x = yearToX(work.year) + (offsetIndex % 5) * 160 - 160;
  const y = LANE.ARTWORK + (offsetIndex % 3) * 40;
  const opacity = useViewportFade(x, scrollX, viewportW);
  const [imgErr, setImgErr] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (opacity < 0.02) return null;
  const thumb = work.thumbnailUrl || work.imageUrl;

  return (
    <div
      onClick={() => onClick(work)}
      style={{
        position: "absolute", left: x - 55, top: y,
        width: 110, height: 80,
        opacity,
        transform: `scale(${0.92 + opacity * 0.08})`,
        transition: "transform 0.2s",
        cursor: "pointer",
      }}>
      <div style={{
        width: "100%", height: "100%",
        border: "1px solid rgba(200,169,110,0.25)",
        background: "#0d0d0d",
        overflow: "hidden",
        position: "relative",
      }}>
        {thumb && !imgErr ? (
          <img src={thumb} alt={work.title}
            onError={() => setImgErr(true)}
            onLoad={() => setLoaded(true)}
            onContextMenu={e => e.preventDefault()}
            onDragStart={e => e.preventDefault()}
            style={{
              width: "100%", height: "100%", objectFit: "cover",
              opacity: loaded ? 0.85 : 0, transition: "opacity 0.4s",
            }}/>
        ) : (
          <div style={{
            width: "100%", height: "100%", display: "flex",
            alignItems: "center", justifyContent: "center",
            color: "#444", fontSize: "20px",
          }}>◎</div>
        )}
      </div>
      <div style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: "9px", color: "#6a5a38",
        marginTop: 3, textAlign: "center", lineHeight: 1.2,
        maxWidth: 110, overflow: "hidden",
        whiteSpace: "nowrap", textOverflow: "ellipsis",
      }}>
        {work.title}
      </div>
    </div>
  );
}

// ── Letter viewer panel ────────────────────────────────────────────────────────
function LetterViewer({ artefact, artworksMap, onClose }) {
  const [activePage, setActivePage] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    const onKey = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const pages         = artefact.pages || [];
  const hasPages      = pages.length > 0;
  const mentionedWorks = (artefact.mentionedArtworks || [])
    .filter((w, i, arr) => arr.findIndex(x => x.title === w.title) === i);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.88)",
      display: "flex", alignItems: "stretch",
      backdropFilter: "blur(4px)",
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      <div style={{
        width: "100%", maxWidth: 1100, margin: "auto",
        height: "90vh", display: "flex", flexDirection: "column",
        background: "#0d0d0d",
        border: "1px solid rgba(200,169,110,0.2)",
        boxShadow: "0 0 80px rgba(0,0,0,0.8)",
      }}>

        {/* Header */}
        <div style={{
          padding: "18px 28px", borderBottom: "1px solid rgba(200,169,110,0.12)",
          display: "flex", alignItems: "baseline", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "11px", letterSpacing: "2px", color: "#8a7550",
              textTransform: "uppercase", marginBottom: 4,
            }}>
              {artefact.institution} · {artefact.dateLabel}
            </div>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "22px", color: "#e8d9b8", fontWeight: 600,
            }}>
              {artefact.sender} to {artefact.recipient}
            </div>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "13px", color: "#666", marginTop: 3,
            }}>
              {artefact.wordCount?.toLocaleString()} words
              {artefact.note && <> · {artefact.note}</>}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: "#666",
            cursor: "pointer", fontSize: "22px", lineHeight: 1,
            padding: "4px 8px", flexShrink: 0,
          }}>×</button>
        </div>

        {/* Body */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* Left — manuscript page */}
          {hasPages && (
            <div style={{
              width: "42%", flexShrink: 0,
              borderRight: "1px solid rgba(200,169,110,0.12)",
              display: "flex", flexDirection: "column",
              background: "#080808",
            }}>
              <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
                <img src={pages[activePage]} alt={`Page ${activePage + 1}`}
                  style={{
                    width: "100%", height: "100%", objectFit: "contain",
                    padding: 20,
                  }}/>
              </div>
              {pages.length > 1 && (
                <div style={{
                  padding: "10px 16px",
                  borderTop: "1px solid rgba(200,169,110,0.12)",
                  display: "flex", gap: 8, overflowX: "auto",
                  flexShrink: 0,
                }}>
                  {pages.map((pg, i) => (
                    <div key={i}
                      onClick={() => setActivePage(i)}
                      style={{
                        width: 40, height: 52, flexShrink: 0,
                        border: `1px solid ${i === activePage ? "#c8a96e" : "#333"}`,
                        cursor: "pointer", overflow: "hidden", background: "#0a0a0a",
                      }}>
                      <img src={pg} alt={`p${i+1}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Right — transcription */}
          <div ref={scrollRef} style={{
            flex: 1, overflowY: "auto", padding: "28px 36px 28px 32px",
          }}>
            {/* Mentioned artworks */}
            {mentionedWorks.length > 0 && (
              <div style={{ marginBottom: 24, padding: "14px 16px",
                border: "1px solid rgba(200,169,110,0.15)",
                background: "rgba(200,169,110,0.04)" }}>
                <div style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "10px", letterSpacing: "2px", color: "#8a7550",
                  textTransform: "uppercase", marginBottom: 10,
                }}>
                  Artworks mentioned in this letter
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {mentionedWorks.map((w, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {w.thumbnailUrl && (
                        <img src={w.thumbnailUrl} alt={w.title}
                          style={{ width: 36, height: 28, objectFit: "cover",
                            border: "1px solid rgba(200,169,110,0.2)" }}/>
                      )}
                      <span style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: "12px", color: "#b09060", fontStyle: "italic",
                      }}>{w.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transcription text */}
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "16px", lineHeight: 1.85,
              color: "#c8bda8",
              whiteSpace: "pre-wrap",
              fontStyle: "italic",
            }}>
              {artefact.transcription}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Event detail panel ─────────────────────────────────────────────────────────
function EventDetail({ event, onClose }) {
  useEffect(() => {
    const onKey = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const colour = SUBJECT_COLOUR[event.subject] || "#888";

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.75)",
        display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(3px)",
      }}>
      <div style={{
        width: "100%", maxWidth: 560,
        background: "#0d0d0d",
        border: `1px solid ${colour}33`,
        boxShadow: "0 0 60px rgba(0,0,0,0.8)",
        padding: "32px 36px",
      }}>
        <div style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "10px", letterSpacing: "2px",
          color: colour, textTransform: "uppercase", marginBottom: 8, opacity: 0.8,
        }}>
          {event.subject} · {event.dateLabel}
        </div>
        <div style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "18px", color: "#e8d9b8", lineHeight: 1.6,
          marginBottom: event.source ? 20 : 0,
        }}>
          {event.text}
        </div>
        {event.source && (
          <div style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "11px", color: "#555", marginTop: 16,
            fontStyle: "italic",
          }}>
            Source: {event.source}
          </div>
        )}
        <button onClick={onClose} style={{
          marginTop: 24, background: "none",
          border: `1px solid ${colour}44`, color: colour,
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "12px", letterSpacing: "1.5px",
          textTransform: "uppercase",
          padding: "8px 20px", cursor: "pointer",
        }}>
          Close
        </button>
      </div>
    </div>
  );
}

// ── Filter bar ─────────────────────────────────────────────────────────────────
function FilterBar({ filters, onChange }) {
  const items = [
    { key: "john",   label: "John Luke",   colour: "#c8a96e" },
    { key: "james",  label: "James' diary",colour: "#7eb8c4" },
    { key: "family", label: "Family",      colour: "#a09080" },
    { key: "letters",label: "Letters",     colour: "#c8a96e" },
    { key: "artworks",label: "Artworks",   colour: "#8a8a8a" },
  ];
  return (
    <div style={{
      display: "flex", gap: 8, alignItems: "center",
      padding: "0 24px",
    }}>
      <span style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: "10px", letterSpacing: "2px", color: "#555",
        textTransform: "uppercase", marginRight: 8,
      }}>Show</span>
      {items.map(({ key, label, colour }) => {
        const active = filters[key];
        return (
          <button key={key} onClick={() => onChange(key, !active)} style={{
            background: active ? `${colour}18` : "transparent",
            border: `1px solid ${active ? colour : "#333"}`,
            color: active ? colour : "#555",
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "11px", letterSpacing: "1px",
            padding: "5px 14px", cursor: "pointer",
            transition: "all 0.2s",
          }}>
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function LifeAndTimes() {
  const containerRef = useRef(null);
  const [scrollX, setScrollX]     = useState(0);
  const [viewportW, setViewportW]  = useState(window.innerWidth);
  const [data, setData]            = useState(null);
  const [loading, setLoading]      = useState(true);
  const [error, setError]          = useState(null);
  const [selected, setSelected]    = useState(null);  // { type: "event"|"letter"|"artwork", item }
  const [filters, setFilters]      = useState({
    john: true, james: true, family: true, letters: true, artworks: true,
  });

  // Fetch data
  useEffect(() => {
    fetch("/api/life-and-times")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  // Scroll & resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => setScrollX(el.scrollLeft);
    const onResize = () => setViewportW(el.clientWidth);
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    // Scroll to John's birth year on load
    el.scrollLeft = yearToX(1906) - el.clientWidth * 0.35;
    setScrollX(el.scrollLeft);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [data]);

  // Inject CSS
  useEffect(() => {
    const style = document.createElement("style");
    style.setAttribute("data-lat", "1");
    style.textContent = `
      .lat-scroll::-webkit-scrollbar { height: 3px; }
      .lat-scroll::-webkit-scrollbar-track { background: #0a0a0a; }
      .lat-scroll::-webkit-scrollbar-thumb { background: #333; }
      .lat-scroll { scrollbar-width: thin; scrollbar-color: #333 #0a0a0a; }
    `;
    document.head.appendChild(style);
    return () => { const s = document.querySelector("[data-lat='1']"); if (s) s.remove(); };
  }, []);

  const handleFilter = useCallback((key, val) => {
    setFilters(f => ({ ...f, [key]: val }));
  }, []);

  if (loading) return (
    <div style={{ background: "#080808", height: "100vh", display: "flex",
      alignItems: "center", justifyContent: "center",
      fontFamily: "'Cormorant Garamond', serif", color: "#555", fontSize: "16px",
      letterSpacing: "2px" }}>
      Loading…
    </div>
  );

  if (error) return (
    <div style={{ background: "#080808", height: "100vh", display: "flex",
      alignItems: "center", justifyContent: "center", color: "#c44",
      fontFamily: "monospace", padding: 40 }}>
      {error}
    </div>
  );

  const { events = [], artefacts = [], artworks = [] } = data || {};

  // Build offset maps for staggering items at the same year
  const eventsByYear   = {};
  const lettersByYear  = {};
  const artworksByYear = {};
  events.forEach(e => {
    const k = e.year;
    eventsByYear[k] = (eventsByYear[k] || 0);
    e._offset = eventsByYear[k]++;
  });
  artefacts.forEach(a => {
    const k = a.year;
    lettersByYear[k] = (lettersByYear[k] || 0);
    a._offset = lettersByYear[k]++;
  });
  artworks.forEach(w => {
    const k = w.year;
    artworksByYear[k] = (artworksByYear[k] || 0);
    w._offset = artworksByYear[k]++;
  });

  // Filter visible items
  const visLeft  = scrollX - VIEWPORT_PAD;
  const visRight = scrollX + viewportW + VIEWPORT_PAD;

  const visibleEvents = filters.john || filters.james || filters.family
    ? events.filter(e => {
        const x = yearToX(e.year);
        if (x < visLeft || x > visRight) return false;
        if (e.subject === "John Luke" && !filters.john && !filters.family) return false;
        if (e.subject === "James Luke" && !filters.james) return false;
        if (e.subject === "Luke family" && !filters.family) return false;
        return true;
      })
    : [];

  const visibleLetters = filters.letters
    ? artefacts.filter(a => {
        const x = yearToX(a.year);
        return x >= visLeft && x <= visRight;
      })
    : [];

  const visibleArtworks = filters.artworks
    ? artworks.filter(w => {
        const x = yearToX(w.year);
        return x >= visLeft && x <= visRight;
      })
    : [];

  const artworksMap = {};
  artworks.forEach(w => { artworksMap[w.artworkId] = w; });

  return (
    <div style={{
      background: "#080808", minHeight: "100vh",
      display: "flex", flexDirection: "column",
      fontFamily: "'Cormorant Garamond', serif",
    }}>
      {/* Top bar */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(8,8,8,0.95)", borderBottom: "1px solid #1a1a1a",
        height: 64, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 0 0 24px",
        backdropFilter: "blur(8px)",
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 24 }}>
          <Link to="/" style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "11px", letterSpacing: "2px", color: "#555",
            textDecoration: "none", textTransform: "uppercase",
          }}>
            John Luke
          </Link>
          <span style={{ color: "#2a2a2a" }}>·</span>
          <span style={{
            fontSize: "11px", letterSpacing: "2px", color: "#8a7550",
            textTransform: "uppercase",
          }}>
            Life &amp; Times
          </span>
        </div>

        <FilterBar filters={filters} onChange={handleFilter} />

        {/* Legend */}
        <div style={{
          display: "flex", gap: 20, padding: "0 24px",
          fontSize: "10px", letterSpacing: "1px",
          color: "#555", textTransform: "uppercase",
        }}>
          {Object.entries(SUBJECT_COLOUR).map(([subject, colour]) => (
            <span key={subject} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{
                width: 8, height: 8, borderRadius: "50%",
                background: colour, display: "inline-block", opacity: 0.8,
              }}/>
              {subject.replace("John Luke", "John").replace("Luke family", "Family")}
            </span>
          ))}
        </div>
      </div>

      {/* Scrollable canvas */}
      <div
        ref={containerRef}
        className="lat-scroll"
        style={{
          flex: 1,
          overflowX: "auto", overflowY: "hidden",
          marginTop: 64,
          height: "calc(100vh - 64px)",
          cursor: "grab",
          userSelect: "none",
          position: "relative",
        }}
        onMouseDown={e => {
          const el = containerRef.current;
          const startX = e.pageX + el.scrollLeft;
          const onMove = ev => { el.scrollLeft = startX - ev.pageX; };
          const onUp   = () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
            el.style.cursor = "grab";
          };
          el.style.cursor = "grabbing";
          window.addEventListener("mousemove", onMove);
          window.addEventListener("mouseup", onUp);
        }}>

        {/* SVG layer — axis, events, letters */}
        <svg
          width={CANVAS_WIDTH}
          height={AXIS_Y + 280}
          style={{ position: "absolute", top: 0, left: 0, overflow: "visible" }}>

          <DecadeBands/>
          <YearAxis scrollX={scrollX} viewportW={viewportW}/>

          {/* Birth/death markers */}
          {[
            { year: 1874, label: "James Luke b.", colour: "#a09080" },
            { year: 1906, label: "John Luke b.", colour: "#c8a96e" },
            { year: 1975, label: "John Luke d.", colour: "#c8a96e" },
          ].map(({ year, label, colour }) => (
            <g key={year}>
              <line x1={yearToX(year)} y1={AXIS_Y - 40} x2={yearToX(year)} y2={AXIS_Y + 40}
                stroke={colour} strokeWidth={1.5} opacity={0.4}/>
              <text x={yearToX(year)} y={AXIS_Y - 48}
                textAnchor="middle" fill={colour}
                fontSize="10" fontFamily="'Cormorant Garamond', serif"
                letterSpacing="0.5" opacity={0.7}>
                {label}
              </text>
            </g>
          ))}

          {/* Life events */}
          {visibleEvents.map((e, i) => (
            <EventMarker key={e.eventId || i}
              event={e} scrollX={scrollX} viewportW={viewportW}
              onClick={ev => setSelected({ type: "event", item: ev })}
              offsetIndex={e._offset || 0}/>
          ))}

          {/* Letter markers */}
          {visibleLetters.map((a, i) => (
            <LetterMarker key={a.artefactId || i}
              artefact={a} scrollX={scrollX} viewportW={viewportW}
              onClick={ar => setSelected({ type: "letter", item: ar })}
              offsetIndex={a._offset || 0}/>
          ))}
        </svg>

        {/* HTML layer — artwork thumbnails (positioned divs) */}
        <div style={{ position: "absolute", top: 0, left: 0, width: CANVAS_WIDTH, height: AXIS_Y + 280 }}>
          {visibleArtworks.map((w, i) => (
            <ArtworkMarker key={w.artworkId || i}
              work={w} scrollX={scrollX} viewportW={viewportW}
              onClick={wk => setSelected({ type: "artwork", item: wk })}
              offsetIndex={w._offset || 0}/>
          ))}
        </div>

        {/* Canvas spacer */}
        <div style={{ width: CANVAS_WIDTH, height: AXIS_Y + 300 }}/>
      </div>

      {/* Detail panels */}
      {selected?.type === "letter" && (
        <LetterViewer
          artefact={selected.item}
          artworksMap={artworksMap}
          onClose={() => setSelected(null)}/>
      )}
      {selected?.type === "event" && (
        <EventDetail
          event={selected.item}
          onClose={() => setSelected(null)}/>
      )}
      {selected?.type === "artwork" && (
        <EventDetail
          event={{
            subject:   "John Luke",
            dateLabel: String(selected.item.year),
            text:      selected.item.title,
            source:    selected.item.medium,
          }}
          onClose={() => setSelected(null)}/>
      )}
    </div>
  );
}
