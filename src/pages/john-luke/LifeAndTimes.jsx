import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";

// ── Constants ──────────────────────────────────────────────────────────────────
const PX_PER_YEAR    = 560;
const START_YEAR     = 1865;
const END_YEAR       = 1978;
const CANVAS_PADDING = 600;
const CANVAS_WIDTH   = (END_YEAR - START_YEAR) * PX_PER_YEAR + CANVAS_PADDING * 2;
const TOTAL_H        = 760;
const AXIS_Y         = 420;
const VIEWPORT_PAD   = 900;

const ABOVE_SLOTS = [380, 320, 260, 200, 150, 110];
const BELOW_SLOTS = [460, 510, 560, 610];

function yearToX(year) {
  return CANVAS_PADDING + (year - START_YEAR) * PX_PER_YEAR;
}
function xToYear(x) {
  return START_YEAR + (x - CANVAS_PADDING) / PX_PER_YEAR;
}

const C = {
  john:   "#c8a96e",
  james:  "#7eb8c4",
  family: "#9a8878",
  bg:     "#070707",
  axis:   "#2a2a2a",
  text:   "#e8d9b8",
};

function viewportFade(x, scrollX, viewportW) {
  const centre    = scrollX + viewportW / 2;
  const dist      = Math.abs(x - centre);
  const halfW     = viewportW / 2;
  const fadeStart = halfW * 0.55;
  const fadeEnd   = halfW * 0.92;
  if (dist < fadeStart) return 1;
  if (dist > fadeEnd)   return 0;
  return 1 - (dist - fadeStart) / (fadeEnd - fadeStart);
}

const SCOPED_CSS = `
  .lat-root { position: fixed; inset: 0; background: #070707; overflow: hidden;
    font-family: 'Cormorant Garamond', serif; display: flex; flex-direction: column; }
  .lat-scroll { flex: 1; overflow-x: auto; overflow-y: hidden; cursor: grab;
    user-select: none; position: relative; }
  .lat-scroll:active { cursor: grabbing; }
  .lat-scroll::-webkit-scrollbar { height: 2px; }
  .lat-scroll::-webkit-scrollbar-track { background: #0a0a0a; }
  .lat-scroll::-webkit-scrollbar-thumb { background: #2a2a2a; }
  .lat-scroll { scrollbar-width: thin; scrollbar-color: #2a2a2a #0a0a0a; }
  .lat-bar { position: relative; z-index: 10; flex-shrink: 0;
    height: 56px; display: flex; align-items: center; justify-content: space-between;
    padding: 0 24px; border-bottom: 1px solid #181818;
    background: rgba(7,7,7,0.97); backdrop-filter: blur(8px); }
  .lat-nav { display: flex; align-items: baseline; gap: 20px; }
  .lat-nav a { font-size: 10px; letter-spacing: 2px; color: #444;
    text-decoration: none; text-transform: uppercase; }
  .lat-nav a:hover { color: #888; }
  .lat-nav-title { font-size: 10px; letter-spacing: 2px; color: #c8a96e;
    text-transform: uppercase; }
  .lat-filters { display: flex; gap: 6px; align-items: center; }
  .lat-filter { background: transparent; border: 1px solid #2a2a2a; color: #444;
    font-family: 'Cormorant Garamond', serif; font-size: 11px; letter-spacing: 1px;
    padding: 4px 13px; cursor: pointer; transition: all 0.18s; }
  .lat-filter.on { border-color: var(--c); color: var(--c); background: rgba(0,0,0,0.3); }
  .lat-legend { display: flex; gap: 18px; align-items: center; }
  .lat-legend-item { display: flex; align-items: center; gap: 6px;
    font-size: 9px; letter-spacing: 1.5px; color: #444; text-transform: uppercase; }
  .lat-legend-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .lat-hint { position: absolute; bottom: 18px; left: 50%; transform: translateX(-50%);
    font-size: 9px; letter-spacing: 2.5px; color: #2a2a2a; text-transform: uppercase;
    pointer-events: none; white-space: nowrap; }
  .lat-year-display { position: absolute; right: 24px; bottom: 14px;
    font-size: 11px; letter-spacing: 3px; color: #1e1e1e; pointer-events: none; }
  .lat-overlay { position: fixed; inset: 0; z-index: 300;
    background: rgba(0,0,0,0.82); display: flex; align-items: center;
    justify-content: center; backdrop-filter: blur(4px); }
  .lat-panel { width: 100%; max-width: 540px; background: #0c0c0c;
    border: 1px solid #252525; padding: 36px 40px;
    box-shadow: 0 0 80px rgba(0,0,0,0.9); }
  .lat-panel-pre { font-size: 9px; letter-spacing: 2px; text-transform: uppercase;
    opacity: 0.7; margin-bottom: 10px; }
  .lat-panel-body { font-size: 19px; line-height: 1.65; color: #e8d9b8;
    margin-bottom: 16px; }
  .lat-panel-source { font-size: 11px; color: #444; font-style: italic; }
  .lat-panel-close { margin-top: 28px; background: none; border: 1px solid #333;
    color: #555; font-family: 'Cormorant Garamond', serif; font-size: 11px;
    letter-spacing: 1.5px; text-transform: uppercase; padding: 8px 20px; cursor: pointer; }
  .lat-panel-close:hover { border-color: #666; color: #999; }
`;

function YearAxis({ scrollX, viewportW }) {
  const first = Math.max(START_YEAR, Math.floor(xToYear(scrollX - 100)));
  const last  = Math.min(END_YEAR,   Math.ceil(xToYear(scrollX + viewportW + 100)));
  const ticks = [];
  for (let y = Math.ceil(first / 5) * 5; y <= last; y += 5) {
    const x       = yearToX(y);
    const isMajor = y % 10 === 0;
    ticks.push(
      <g key={y}>
        <line x1={x} y1={AXIS_Y - (isMajor ? 12 : 7)}
              x2={x} y2={AXIS_Y + (isMajor ? 12 : 7)}
              stroke={isMajor ? "#3a3a3a" : "#1e1e1e"} strokeWidth={isMajor ? 1.5 : 1}/>
        {isMajor && (
          <text x={x} y={AXIS_Y + 28} textAnchor="middle"
            fill="#353535" fontSize="10"
            fontFamily="'Cormorant Garamond', serif" letterSpacing="1">
            {y}
          </text>
        )}
      </g>
    );
  }
  return (
    <g>
      <line x1={0} x2={CANVAS_WIDTH} y1={AXIS_Y} y2={AXIS_Y}
        stroke="#2a2a2a" strokeWidth={1}/>
      {ticks}
    </g>
  );
}

function DecadeBands() {
  const bands = [];
  for (let d = Math.floor(START_YEAR / 10) * 10; d <= END_YEAR; d += 10) {
    if ((d / 10) % 2 === 0) {
      bands.push(
        <rect key={d} x={yearToX(d)} y={0} width={PX_PER_YEAR * 10} height={TOTAL_H}
          fill="rgba(255,255,255,0.007)"/>
      );
    }
  }
  return <>{bands}</>;
}

function EventMarker({ event, scrollX, viewportW, onClick, slotY }) {
  const monthOffset = event.month ? ((event.month - 0.5) / 12) * PX_PER_YEAR : 0;
  const x     = yearToX(event.year) + monthOffset;
  const alpha  = viewportFade(x, scrollX, viewportW);
  if (alpha < 0.02) return null;

  const isJames  = event.subject === "James Luke";
  const isFamily = event.subject === "Luke family";
  const isMajor  = event.significance === "major";
  const colour   = isJames ? C.james : isFamily ? C.family : C.john;

  const isBelow = isJames;
  const stemY1  = isBelow ? AXIS_Y + 4 : AXIS_Y - 4;
  const stemY2  = isBelow ? slotY - 14 : slotY + 14;
  const textY   = isBelow ? slotY : slotY - 52;

  return (
    <g style={{ opacity: alpha, cursor: "pointer" }} onClick={() => onClick(event)}>
      <circle cx={x} cy={AXIS_Y} r={isMajor ? 3.5 : 2}
        fill={isMajor ? colour : "none"}
        stroke={colour} strokeWidth={isMajor ? 0 : 1} opacity={0.9}/>
      <line x1={x} y1={stemY1} x2={x} y2={stemY2}
        stroke={colour} strokeWidth={isMajor ? 1 : 0.7}
        strokeDasharray={isMajor ? "none" : "2,3"} opacity={0.4}/>
      <foreignObject x={x - 100} y={textY} width={200} height={60}
        style={{ overflow: "visible", pointerEvents: "none" }}>
        <div style={{
          textAlign: "center",
          color: isMajor ? colour : (isFamily ? "#5a4e44" : "#3a6070"),
          textShadow: "0 1px 10px rgba(0,0,0,1), 0 0 24px rgba(0,0,0,0.9)",
        }}>
          {isMajor && (
            <div style={{ fontSize: "8px", letterSpacing: "1.8px", opacity: 0.6,
              textTransform: "uppercase", marginBottom: 2,
              fontFamily: "'Cormorant Garamond', serif" }}>
              {event.dateLabel || String(event.year)}
            </div>
          )}
          <div style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: isMajor ? "11px" : "10px",
            fontWeight: isMajor ? 600 : 400,
            lineHeight: 1.35,
          }}>
            {event.text.length > 65 ? event.text.slice(0, 63) + "\u2026" : event.text}
          </div>
        </div>
      </foreignObject>
    </g>
  );
}

function ArtworkMarker({ work, scrollX, viewportW, slotX, slotY, onClick }) {
  const alpha = viewportFade(slotX, scrollX, viewportW);
  const [err, setErr]       = useState(false);
  const [loaded, setLoaded] = useState(false);
  if (alpha < 0.02) return null;

  const thumb = work.thumbnailUrl || work.imageUrl;
  const W = 88, H = 62;

  return (
    <div onClick={() => onClick(work)} style={{
      position: "absolute", left: slotX - W / 2, top: slotY,
      width: W, height: H + 18,
      opacity: alpha,
      transform: "scale(" + (0.93 + alpha * 0.07) + ")",
      cursor: "pointer", transition: "transform 0.15s", pointerEvents: "auto",
    }}>
      <div style={{ width: W, height: H, background: "#0d0d0d",
        border: "1px solid rgba(200,169,110,0.15)", overflow: "hidden" }}>
        {thumb && !err ? (
          <img src={thumb} alt={work.title}
            onError={() => setErr(true)} onLoad={() => setLoaded(true)}
            onContextMenu={e => e.preventDefault()}
            onDragStart={e => e.preventDefault()}
            style={{ width: "100%", height: "100%", objectFit: "cover",
              opacity: loaded ? 0.8 : 0, transition: "opacity 0.3s" }}/>
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex",
            alignItems: "center", justifyContent: "center", color: "#2a2a2a", fontSize: 16 }}>
            &#9676;
          </div>
        )}
      </div>
      <div style={{ fontFamily: "'Cormorant Garamond', serif",
        fontSize: "8px", color: "#4a3a1e", marginTop: 3,
        textAlign: "center", lineHeight: 1.2,
        overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
        maxWidth: W }}>
        {work.title}
      </div>
    </div>
  );
}

function AnchorMarker({ year, label, colour, above }) {
  const x = yearToX(year);
  const textY = above !== false ? AXIS_Y - 72 : AXIS_Y + 76;
  return (
    <g>
      <line x1={x} y1={AXIS_Y - 50} x2={x} y2={AXIS_Y + 50}
        stroke={colour} strokeWidth={1} opacity={0.2}/>
      <circle cx={x} cy={AXIS_Y} r={5} fill={colour} opacity={0.6}/>
      <text x={x} y={textY} textAnchor="middle"
        fill={colour} fontSize="9" opacity={0.6}
        fontFamily="'Cormorant Garamond', serif" letterSpacing="0.5">
        {label}
      </text>
    </g>
  );
}

function EventDetail({ item, onClose }) {
  useEffect(() => {
    const fn = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const isEvent = item.type === "event";
  const colour  = isEvent
    ? (item.data.subject === "James Luke" ? C.james
       : item.data.subject === "Luke family" ? C.family : C.john)
    : C.john;

  const pre    = isEvent
    ? ((item.data.subject || "John Luke") + " \u00b7 " + (item.data.dateLabel || item.data.year))
    : ("Artwork \u00b7 " + item.data.year);
  const body   = isEvent ? item.data.text : item.data.title;
  const source = isEvent ? item.data.source : item.data.medium;

  return (
    <div className="lat-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="lat-panel">
        <div className="lat-panel-pre" style={{ color: colour }}>{pre}</div>
        <div className="lat-panel-body">{body}</div>
        {source && <div className="lat-panel-source">{source}</div>}
        <button className="lat-panel-close" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

function FilterBar({ filters, onChange }) {
  const btns = [
    { key: "john",    label: "John Luke",    c: C.john   },
    { key: "james",   label: "James\u2019 diary", c: C.james  },
    { key: "family",  label: "Family",       c: C.family },
    { key: "artworks",label: "Artworks",     c: "#7a7a7a"},
  ];
  return (
    <div className="lat-filters">
      {btns.map(({ key, label, c }) => (
        <button key={key}
          className={"lat-filter" + (filters[key] ? " on" : "")}
          style={{ "--c": c }}
          onClick={() => onChange(key, !filters[key])}>
          {label}
        </button>
      ))}
    </div>
  );
}

function assignSlots(events) {
  const SLOT_MIN_GAP = 155;
  const slotLastX_above = ABOVE_SLOTS.map(() => -Infinity);
  const slotLastX_below = BELOW_SLOTS.map(() => -Infinity);

  return events.map(e => {
    const x       = yearToX(e.year) + (e.month ? ((e.month - 0.5) / 12) * PX_PER_YEAR : 0);
    const isBelow = e.subject === "James Luke";
    const slots   = isBelow ? slotLastX_below : slotLastX_above;
    const slotYs  = isBelow ? BELOW_SLOTS : ABOVE_SLOTS;
    const isMajor = e.significance === "major";
    const start   = isMajor ? 0 : 2;
    let best = start;
    for (let s = start; s < slots.length; s++) {
      if (x - slots[s] >= SLOT_MIN_GAP) { best = s; break; }
      best = s;
    }
    slots[best] = x;
    return { ...e, _slotY: slotYs[best] };
  });
}

export default function LifeAndTimes() {
  const containerRef              = useRef(null);
  const [scrollX, setScrollX]     = useState(0);
  const [viewportW, setViewportW] = useState(window.innerWidth);
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [selected, setSelected]   = useState(null);
  const [hintVisible, setHint]    = useState(true);
  const [filters, setFilters]     = useState({
    john: true, james: true, family: true, artworks: true,
  });

  useEffect(() => {
    const el = document.createElement("style");
    el.setAttribute("data-lat", "1");
    el.textContent = SCOPED_CSS;
    document.head.appendChild(el);
    return () => document.querySelector("[data-lat='1']")?.remove();
  }, []);

  useEffect(() => {
    fetch("/api/life-and-times")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => { setScrollX(el.scrollLeft); setHint(el.scrollLeft < 30); };
    const onResize = () => setViewportW(el.clientWidth);
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    const target = yearToX(1895) - el.clientWidth * 0.2;
    el.scrollLeft = Math.max(0, target);
    setScrollX(el.scrollLeft);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [data]);

  const onMouseDown = useCallback(e => {
    const el = containerRef.current;
    if (!el) return;
    const startX = e.pageX + el.scrollLeft;
    const onMove = ev => { el.scrollLeft = startX - ev.pageX; };
    const onUp   = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, []);

  const handleFilter = useCallback((k, v) => setFilters(f => ({ ...f, [k]: v })), []);

  if (loading) return (
    <div className="lat-root" style={{ alignItems: "center", justifyContent: "center",
      color: "#333", fontSize: "12px", letterSpacing: "3px" }}>
      Loading\u2026
    </div>
  );
  if (error) return (
    <div className="lat-root" style={{ alignItems: "center", justifyContent: "center",
      color: "#844", fontSize: "12px", padding: 40 }}>
      {error}
    </div>
  );

  const { events = [], artworks = [] } = data || {};

  const eventsWithSlots = assignSlots(
    events.filter(e => {
      if (e.subject === "John Luke"   && !filters.john)   return false;
      if (e.subject === "James Luke"  && !filters.james)  return false;
      if (e.subject === "Luke family" && !filters.family) return false;
      return true;
    })
  );

  const artworkItems = filters.artworks
    ? artworks.filter(w => w.year >= START_YEAR && w.year <= END_YEAR)
    : [];

  const ART_GAP = 96;
  let lastArtX = -Infinity;
  const artworkSlots = artworkItems.map((w, i) => {
    const preferred = yearToX(w.year);
    const x = Math.max(preferred, lastArtX + ART_GAP);
    lastArtX = x;
    const y = 24 + (i % 3) * 28;
    return { ...w, _sx: x, _sy: y };
  });

  const visLeft  = scrollX - VIEWPORT_PAD;
  const visRight = scrollX + viewportW + VIEWPORT_PAD;
  const visEvents   = eventsWithSlots.filter(e => yearToX(e.year) >= visLeft && yearToX(e.year) <= visRight);
  const visArtworks = artworkSlots.filter(w => w._sx >= visLeft && w._sx <= visRight);
  const currentYear = Math.round(xToYear(scrollX + viewportW / 2));

  return (
    <div className="lat-root">
      <div className="lat-bar">
        <div className="lat-nav">
          <Link to="/">John Luke</Link>
          <span style={{ color: "#1a1a1a" }}>&#183;</span>
          <span className="lat-nav-title">Life &amp; Times</span>
        </div>
        <FilterBar filters={filters} onChange={handleFilter}/>
        <div className="lat-legend">
          {[
            { label: "John Luke",    c: C.john   },
            { label: "James\u2019 diary", c: C.james  },
            { label: "Family",       c: C.family },
          ].map(({ label, c }) => (
            <div key={label} className="lat-legend-item">
              <span className="lat-legend-dot" style={{ background: c }}/>
              {label}
            </div>
          ))}
        </div>
      </div>

      <div ref={containerRef} className="lat-scroll" onMouseDown={onMouseDown}>
        <svg width={CANVAS_WIDTH} height={TOTAL_H}
          style={{ position: "absolute", top: 0, left: 0, display: "block" }}>
          <DecadeBands/>
          {[1870,1880,1890,1900,1910,1920,1930,1940,1950,1960,1970].map(d => (
            <text key={d} x={yearToX(d) + PX_PER_YEAR * 5} y={AXIS_Y + 50}
              textAnchor="middle" fill="#1a1a1a" fontSize="26"
              fontFamily="'Cormorant Garamond', serif" fontStyle="italic"
              style={{ userSelect: "none", pointerEvents: "none" }}>
              {d}s
            </text>
          ))}
          <YearAxis scrollX={scrollX} viewportW={viewportW}/>
          <AnchorMarker year={1906} label="John born" colour={C.john} above={true}/>
          <AnchorMarker year={1975} label="John died" colour={C.john} above={true}/>
          <AnchorMarker year={1908} label="James born" colour={C.james} above={false}/>
          {visEvents.map((e, i) => (
            <EventMarker key={e.eventId || i}
              event={e} scrollX={scrollX} viewportW={viewportW}
              slotY={e._slotY}
              onClick={ev => setSelected({ type: "event", data: ev })}/>
          ))}
        </svg>

        <div style={{ position: "absolute", top: 0, left: 0,
          width: CANVAS_WIDTH, height: TOTAL_H, pointerEvents: "none" }}>
          {visArtworks.map((w, i) => (
            <ArtworkMarker key={w.artworkId || i}
              work={w} slotX={w._sx} slotY={w._sy}
              scrollX={scrollX} viewportW={viewportW}
              onClick={wk => setSelected({ type: "artwork", data: wk })}/>
          ))}
        </div>

        <div style={{ width: CANVAS_WIDTH, height: TOTAL_H }}/>
        {hintVisible && <div className="lat-hint">Scroll or drag to move through time</div>}
        <div className="lat-year-display">{currentYear}</div>
      </div>

      {selected && <EventDetail item={selected} onClose={() => setSelected(null)}/>}
    </div>
  );
}
