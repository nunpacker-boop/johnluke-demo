import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";

// ── Constants ──────────────────────────────────────────────────────────────────
const PX_PER_YEAR    = 560;
const START_YEAR     = 1865;
const END_YEAR       = 1978;
const CANVAS_PADDING = 700;
const CANVAS_WIDTH   = (END_YEAR - START_YEAR) * PX_PER_YEAR + CANVAS_PADDING * 2;

// ── Fixed swim lane Y positions (pixels from top of canvas) ───────────────────
// Everything is stratified: no item ever overlaps another band.
// Above axis: artworks → John major → John minor → family → letters
// Below axis: James diary
//
//   0 ─── ARTWORK ROW 0 (y=30)
//       ─── ARTWORK ROW 1 (y=100)
//       ─── ARTWORK ROW 2 (y=170)
//   250 ── JOHN MAJOR band  (tall stems, gold)
//   320 ── JOHN MINOR band  (short stems, dim gold)
//   360 ── FAMILY band      (stone)
//   390 ── LETTERS row      (envelope thumbnails)
//   430 ── AXIS
//   475 ── JAMES band       (steel blue, below axis)
//   560 ── JAMES row 2
//
const AXIS_Y = 430;
const BANDS = {
  artwork:     [28, 95, 162],   // three artwork rows above everything
  johnMajor:   252,             // major John events — long stems
  johnMinor:   318,             // minor John events — short stems
  family:      358,             // Luke family history
  letters:     388,             // letter thumbnails
  jamesMajor:  472,             // major James diary
  jamesMinor:  520,             // minor James diary
};
const CANVAS_H = 620;
const VIEWPORT_PAD = 900;

// ── Colours ────────────────────────────────────────────────────────────────────
const C = {
  john:   "#c8a96e",
  james:  "#7eb8c4",
  family: "#9a8878",
  letter: "#b8a070",
  bg:     "#070707",
  axis:   "#282828",
};

function yearToX(year) {
  return CANVAS_PADDING + (year - START_YEAR) * PX_PER_YEAR;
}
function xToYear(x) {
  return START_YEAR + (x - CANVAS_PADDING) / PX_PER_YEAR;
}
function monthOffset(month) {
  return month ? ((month - 0.5) / 12) * PX_PER_YEAR : 0;
}

// Fade items toward viewport edges
function vpFade(x, scrollX, viewportW) {
  const centre = scrollX + viewportW / 2;
  const dist   = Math.abs(x - centre);
  const half   = viewportW / 2;
  const s = half * 0.52, e = half * 0.90;
  if (dist < s) return 1;
  if (dist > e) return 0;
  return 1 - (dist - s) / (e - s);
}

// ── Scoped CSS ─────────────────────────────────────────────────────────────────
const CSS = `
  .lat-root {
    position: fixed; inset: 0; background: #070707; overflow: hidden;
    font-family: 'Cormorant Garamond', serif;
    display: flex; flex-direction: column;
  }
  /* Top bar */
  .lat-bar {
    flex-shrink: 0; height: 56px; z-index: 20;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 28px; border-bottom: 1px solid #161616;
    background: rgba(7,7,7,0.96); backdrop-filter: blur(10px);
  }
  .lat-nav { display: flex; align-items: baseline; gap: 20px; }
  .lat-nav a { font-size: 10px; letter-spacing: 2px; color: #3a3a3a;
    text-decoration: none; text-transform: uppercase; transition: color 0.2s; }
  .lat-nav a:hover { color: #777; }
  .lat-nav-sep { color: #1a1a1a; }
  .lat-nav-title { font-size: 10px; letter-spacing: 2px; color: #c8a96e;
    text-transform: uppercase; }
  /* Filters */
  .lat-filters { display: flex; gap: 5px; align-items: center; }
  .lat-filter {
    background: transparent; border: 1px solid #222; color: #3a3a3a;
    font-family: 'Cormorant Garamond', serif; font-size: 11px; letter-spacing: 1px;
    padding: 4px 13px; cursor: pointer; transition: all 0.18s;
  }
  .lat-filter.on { border-color: var(--c); color: var(--c); background: rgba(0,0,0,0.2); }
  /* Legend */
  .lat-legend { display: flex; gap: 16px; align-items: center; }
  .lat-legend-item { display: flex; align-items: center; gap: 5px;
    font-size: 9px; letter-spacing: 1.5px; color: #3a3a3a; text-transform: uppercase; }
  .lat-legend-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
  /* Year display — large, top right */
  .lat-year {
    position: absolute; top: 64px; right: 32px; z-index: 15;
    font-family: 'Cormorant Garamond', serif;
    font-size: 96px; line-height: 1;
    color: rgba(200,169,110,0.06);
    letter-spacing: -2px; pointer-events: none;
    user-select: none; font-weight: 400;
  }
  /* Scroll canvas */
  .lat-scroll {
    flex: 1; overflow-x: auto; overflow-y: hidden;
    cursor: grab; user-select: none; position: relative;
  }
  .lat-scroll:active { cursor: grabbing; }
  .lat-scroll::-webkit-scrollbar { height: 2px; }
  .lat-scroll::-webkit-scrollbar-track { background: #0a0a0a; }
  .lat-scroll::-webkit-scrollbar-thumb { background: #252525; }
  .lat-scroll { scrollbar-width: thin; scrollbar-color: #252525 #0a0a0a; }
  /* Scroll hint */
  .lat-hint {
    position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%);
    font-size: 9px; letter-spacing: 2.5px; color: #222;
    text-transform: uppercase; pointer-events: none; white-space: nowrap;
    transition: opacity 0.5s;
  }
  /* Band labels — fixed to left edge */
  .lat-band-label {
    position: absolute; left: 0; font-size: 8px; letter-spacing: 2px;
    text-transform: uppercase; opacity: 0.3; pointer-events: none;
    font-family: 'Cormorant Garamond', serif;
  }
  /* Letter thumbnail */
  .lat-letter {
    position: absolute; cursor: pointer; transition: opacity 0.15s;
  }
  .lat-letter:hover .lat-letter-img { border-color: rgba(200,169,110,0.5); }
  .lat-letter-img {
    width: 36px; height: 48px; object-fit: cover;
    border: 1px solid rgba(200,169,110,0.18);
    background: #0d0d0d; display: block;
    transition: border-color 0.2s;
  }
  .lat-letter-placeholder {
    width: 36px; height: 48px;
    border: 1px solid rgba(200,169,110,0.15);
    background: #0d0d0d;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; color: rgba(200,169,110,0.2);
  }
  /* Letter viewer overlay */
  .lat-overlay {
    position: fixed; inset: 0; z-index: 300;
    background: rgba(0,0,0,0.88); display: flex; align-items: center;
    justify-content: center; backdrop-filter: blur(5px);
  }
  .lat-viewer {
    width: 92vw; max-width: 900px; height: 88vh;
    background: #0c0c0c; border: 1px solid #222;
    display: flex; flex-direction: column;
    box-shadow: 0 0 100px rgba(0,0,0,0.95);
  }
  .lat-viewer-head {
    flex-shrink: 0; padding: 20px 28px 16px;
    border-bottom: 1px solid #1a1a1a;
    display: flex; align-items: flex-start; justify-content: space-between;
  }
  .lat-viewer-pre { font-size: 9px; letter-spacing: 2px; text-transform: uppercase;
    color: #c8a96e; opacity: 0.7; margin-bottom: 6px; }
  .lat-viewer-title { font-size: 20px; color: #e8d9b8; line-height: 1.3; }
  .lat-viewer-meta { font-size: 12px; color: #444; margin-top: 4px; }
  .lat-viewer-close { background: none; border: none; color: #444;
    font-size: 22px; cursor: pointer; padding: 0 4px; line-height: 1;
    flex-shrink: 0; margin-left: 16px; }
  .lat-viewer-close:hover { color: #888; }
  .lat-viewer-body { flex: 1; overflow: hidden; display: flex; }
  .lat-viewer-page { width: 40%; flex-shrink: 0; background: #080808;
    border-right: 1px solid #1a1a1a; overflow: hidden; display: flex;
    align-items: center; justify-content: center; padding: 16px; }
  .lat-viewer-page img { max-width: 100%; max-height: 100%; object-fit: contain; }
  .lat-viewer-text { flex: 1; overflow-y: auto; padding: 28px 32px; }
  .lat-viewer-text::-webkit-scrollbar { width: 3px; }
  .lat-viewer-text::-webkit-scrollbar-thumb { background: #2a2a2a; }
  .lat-viewer-artworks { margin-bottom: 20px; padding: 12px 14px;
    border: 1px solid #1e1e1e; background: rgba(200,169,110,0.03); }
  .lat-viewer-artworks-label { font-size: 9px; letter-spacing: 2px; color: #8a7550;
    text-transform: uppercase; margin-bottom: 8px; }
  .lat-viewer-artworks-list { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
  .lat-viewer-art-thumb { width: 32px; height: 24px; object-fit: cover;
    border: 1px solid rgba(200,169,110,0.15); }
  .lat-viewer-art-title { font-size: 11px; color: #8a6030; font-style: italic; }
  .lat-transcription { font-size: 15px; line-height: 1.9; color: #b8a888;
    font-style: italic; white-space: pre-wrap; }
  /* Event detail panel */
  .lat-detail-overlay {
    position: fixed; inset: 0; z-index: 300;
    background: rgba(0,0,0,0.8); display: flex; align-items: center;
    justify-content: center; backdrop-filter: blur(4px);
  }
  .lat-detail {
    width: 100%; max-width: 520px; background: #0c0c0c;
    border: 1px solid #252525; padding: 36px 40px;
    box-shadow: 0 0 80px rgba(0,0,0,0.9);
  }
  .lat-detail-pre { font-size: 9px; letter-spacing: 2px; text-transform: uppercase;
    opacity: 0.7; margin-bottom: 10px; }
  .lat-detail-body { font-size: 18px; line-height: 1.7; color: #e8d9b8; margin-bottom: 14px; }
  .lat-detail-source { font-size: 11px; color: #3a3a3a; font-style: italic; }
  .lat-detail-close { margin-top: 28px; background: none; border: 1px solid #2a2a2a;
    color: #4a4a4a; font-family: 'Cormorant Garamond', serif; font-size: 11px;
    letter-spacing: 1.5px; text-transform: uppercase; padding: 8px 20px; cursor: pointer; }
  .lat-detail-close:hover { border-color: #555; color: #888; }
`;

// ── Year axis (SVG) ────────────────────────────────────────────────────────────
function YearAxis({ scrollX, viewportW }) {
  const first = Math.max(START_YEAR, Math.floor(xToYear(scrollX - 80)));
  const last  = Math.min(END_YEAR,   Math.ceil(xToYear(scrollX + viewportW + 80)));
  const ticks = [];
  for (let y = Math.ceil(first / 5) * 5; y <= last; y += 5) {
    const x = yearToX(y);
    const major = y % 10 === 0;
    ticks.push(
      <g key={y}>
        <line x1={x} y1={AXIS_Y - (major ? 10 : 6)} x2={x} y2={AXIS_Y + (major ? 10 : 6)}
          stroke={major ? "#333" : "#1c1c1c"} strokeWidth={major ? 1.5 : 1}/>
        {major && (
          <text x={x} y={AXIS_Y + 26} textAnchor="middle"
            fill="#2e2e2e" fontSize="10" fontFamily="'Cormorant Garamond', serif" letterSpacing="0.8">
            {y}
          </text>
        )}
      </g>
    );
  }
  return (
    <g>
      <line x1={0} x2={CANVAS_WIDTH} y1={AXIS_Y} y2={AXIS_Y} stroke={C.axis} strokeWidth={1}/>
      {ticks}
    </g>
  );
}

// ── Ghost decade labels ────────────────────────────────────────────────────────
function DecadeGhosts() {
  const labels = [];
  for (let d = 1870; d <= 1970; d += 10) {
    labels.push(
      <text key={d} x={yearToX(d) + PX_PER_YEAR * 5} y={AXIS_Y + 46}
        textAnchor="middle" fill="#151515" fontSize="22"
        fontFamily="'Cormorant Garamond', serif" fontStyle="italic"
        style={{ userSelect: "none", pointerEvents: "none" }}>
        {d}s
      </text>
    );
  }
  return <>{labels}</>;
}

// ── Band separator lines (subtle) ─────────────────────────────────────────────
function BandSeparators() {
  const ys = [BANDS.letters + 60, AXIS_Y];
  return (
    <g>
      {ys.map(y => (
        <line key={y} x1={0} x2={CANVAS_WIDTH} y1={y} y2={y}
          stroke="#111" strokeWidth={1} strokeDasharray="4,8"/>
      ))}
    </g>
  );
}

// ── Anchor points (births, deaths) ────────────────────────────────────────────
function Anchors() {
  const points = [
    { year: 1906, label: "John born", colour: C.john,   above: true  },
    { year: 1975, label: "John died", colour: C.john,   above: true  },
    { year: 1908, label: "James born",colour: C.james,  above: false },
  ];
  return (
    <g>
      {points.map(({ year, label, colour, above }) => {
        const x = yearToX(year);
        return (
          <g key={year + label}>
            <line x1={x} y1={AXIS_Y - 30} x2={x} y2={AXIS_Y + 30}
              stroke={colour} strokeWidth={1} opacity={0.22}/>
            <circle cx={x} cy={AXIS_Y} r={4} fill={colour} opacity={0.55}/>
            <text x={x} y={above ? AXIS_Y - 38 : AXIS_Y + 52}
              textAnchor="middle" fill={colour} fontSize="8.5" opacity={0.55}
              fontFamily="'Cormorant Garamond', serif">
              {label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

// ── Life event marker (SVG) ───────────────────────────────────────────────────
function EventMarker({ event, scrollX, viewportW, onClick }) {
  const x     = yearToX(event.year) + monthOffset(event.month);
  const alpha = vpFade(x, scrollX, viewportW);
  if (alpha < 0.02) return null;

  const isJames  = event.subject === "James Luke";
  const isFamily = event.subject === "Luke family";
  const isMajor  = event.significance === "major";

  const colour = isJames ? C.james : isFamily ? C.family : C.john;
  const bandY  = isJames
    ? (isMajor ? BANDS.jamesMajor : BANDS.jamesMinor)
    : isFamily
    ? BANDS.family
    : (isMajor ? BANDS.johnMajor : BANDS.johnMinor);

  const isBelow = isJames;
  const stemY1  = isBelow ? AXIS_Y + 3 : AXIS_Y - 3;
  const stemY2  = bandY + (isBelow ? -12 : 12);
  const textY   = isBelow ? bandY + 2 : bandY - 48;

  return (
    <g style={{ opacity: alpha, cursor: "pointer" }} onClick={() => onClick(event)}>
      <circle cx={x} cy={AXIS_Y} r={isMajor ? 3.5 : 2.2}
        fill={isMajor ? colour : "none"}
        stroke={colour} strokeWidth={isMajor ? 0 : 1} opacity={0.85}/>
      <line x1={x} y1={stemY1} x2={x} y2={stemY2}
        stroke={colour} strokeWidth={isMajor ? 1.2 : 0.7}
        strokeDasharray={isMajor ? "none" : "2,4"} opacity={0.38}/>
      <foreignObject x={x - 105} y={textY} width={210} height={54}
        style={{ overflow: "visible", pointerEvents: "none" }}>
        <div style={{
          textAlign: "center",
          color: isMajor ? colour : (isFamily ? "#5e5248" : (isJames ? "#3e6878" : "#5a4824")),
          textShadow: "0 1px 12px rgba(0,0,0,1), 0 0 28px rgba(0,0,0,0.95)",
        }}>
          {isMajor && (
            <div style={{ fontFamily: "'Cormorant Garamond', serif",
              fontSize: "8px", letterSpacing: "1.8px", opacity: 0.6,
              textTransform: "uppercase", marginBottom: 2 }}>
              {event.dateLabel || String(event.year)}
            </div>
          )}
          <div style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: isMajor ? "11px" : "9.5px",
            fontWeight: isMajor ? 600 : 400, lineHeight: 1.35,
          }}>
            {event.text.length > 60 ? event.text.slice(0, 58) + "\u2026" : event.text}
          </div>
        </div>
      </foreignObject>
    </g>
  );
}

// ── Letter thumbnail (HTML div) ────────────────────────────────────────────────
function LetterMarker({ artefact, index, scrollX, viewportW, onClick }) {
  const x     = yearToX(artefact.year) + monthOffset(artefact.month) + (index % 3) * 14;
  const alpha = vpFade(x, scrollX, viewportW);
  const [imgErr, setImgErr] = useState(false);

  if (alpha < 0.02) return null;

  const firstPage = artefact.pages?.[0];
  const hasImg    = firstPage && !imgErr;

  const stemTop    = BANDS.letters + 48;
  const stemHeight = AXIS_Y - stemTop;

  return (
    <>
      {/* Stem from letter to axis — SVG would be ideal but we're in HTML layer */}
      <div style={{
        position: "absolute",
        left: x + 18, top: stemTop,
        width: 1, height: stemHeight,
        background: "linear-gradient(to bottom, rgba(200,169,110,0.2), rgba(200,169,110,0))",
        pointerEvents: "none",
        opacity: alpha,
      }}/>
      <div
        className="lat-letter"
        style={{ left: x, top: BANDS.letters, opacity: alpha }}
        onClick={() => onClick(artefact)}>
        {hasImg ? (
          <img className="lat-letter-img" src={firstPage}
            alt={artefact.title}
            onError={() => setImgErr(true)}
            onContextMenu={e => e.preventDefault()}
            onDragStart={e => e.preventDefault()}/>
        ) : (
          <div className="lat-letter-placeholder">✉</div>
        )}
      </div>
    </>
  );
}

// ── Artwork thumbnail (HTML div) ───────────────────────────────────────────────
function ArtworkMarker({ work, rowIndex, xPos, scrollX, viewportW, onClick }) {
  const alpha = vpFade(xPos, scrollX, viewportW);
  const [err, setErr]       = useState(false);
  const [loaded, setLoaded] = useState(false);
  if (alpha < 0.02) return null;

  const thumb = work.thumbnailUrl || work.imageUrl;
  const y     = BANDS.artwork[rowIndex % BANDS.artwork.length];
  const W = 86, H = 62;

  return (
    <div onClick={() => onClick(work)} style={{
      position: "absolute", left: xPos - W / 2, top: y,
      width: W, height: H + 18, opacity: alpha,
      transform: "scale(" + (0.93 + alpha * 0.07) + ")",
      cursor: "pointer", pointerEvents: "auto", transition: "transform 0.12s",
    }}>
      <div style={{ width: W, height: H, background: "#0d0d0d",
        border: "1px solid rgba(200,169,110,0.12)", overflow: "hidden" }}>
        {thumb && !err ? (
          <img src={thumb} alt={work.title}
            onError={() => setErr(true)} onLoad={() => setLoaded(true)}
            onContextMenu={e => e.preventDefault()}
            onDragStart={e => e.preventDefault()}
            style={{ width: "100%", height: "100%", objectFit: "cover",
              opacity: loaded ? 0.82 : 0, transition: "opacity 0.3s" }}/>
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex",
            alignItems: "center", justifyContent: "center",
            color: "#252525", fontSize: 14 }}>&#9676;</div>
        )}
      </div>
      <div style={{ fontFamily: "'Cormorant Garamond', serif",
        fontSize: "8px", color: "#3a2a10", marginTop: 3,
        textAlign: "center", lineHeight: 1.2,
        overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
        maxWidth: W }}>
        {work.title}
      </div>
    </div>
  );
}

// ── Letter viewer panel ────────────────────────────────────────────────────────
function LetterViewer({ artefact, onClose }) {
  useEffect(() => {
    const fn = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const [page, setPage] = useState(0);
  const pages    = artefact.pages || [];
  const artworks = (artefact.mentionedArtworks || [])
    .filter((w, i, a) => a.findIndex(x => x.title === w.title) === i);

  return (
    <div className="lat-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="lat-viewer">
        {/* Header */}
        <div className="lat-viewer-head">
          <div>
            <div className="lat-viewer-pre">
              {artefact.institution} · {artefact.dateLabel}
            </div>
            <div className="lat-viewer-title">
              {artefact.sender} to {artefact.recipient}
            </div>
            <div className="lat-viewer-meta">
              {artefact.wordCount?.toLocaleString()} words
              {artefact.note ? " · " + artefact.note : ""}
            </div>
          </div>
          <button className="lat-viewer-close" onClick={onClose}>×</button>
        </div>

        {/* Body */}
        <div className="lat-viewer-body">
          {/* Page image */}
          {pages.length > 0 && (
            <div className="lat-viewer-page">
              <img src={pages[page]} alt={"Page " + (page + 1)}/>
            </div>
          )}

          {/* Transcription */}
          <div className="lat-viewer-text">
            {artworks.length > 0 && (
              <div className="lat-viewer-artworks">
                <div className="lat-viewer-artworks-label">Artworks mentioned</div>
                <div className="lat-viewer-artworks-list">
                  {artworks.map((w, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      {w.thumbnailUrl && (
                        <img className="lat-viewer-art-thumb"
                          src={w.thumbnailUrl} alt={w.title}/>
                      )}
                      <span className="lat-viewer-art-title">{w.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="lat-transcription">
              {artefact.transcription || "(No transcription available)"}
            </div>
          </div>
        </div>

        {/* Page strip */}
        {pages.length > 1 && (
          <div style={{ flexShrink: 0, display: "flex", gap: 6, padding: "10px 16px",
            borderTop: "1px solid #1a1a1a", overflowX: "auto", background: "#080808" }}>
            {pages.map((pg, i) => (
              <img key={i} src={pg} alt={"p" + (i + 1)}
                onClick={() => setPage(i)}
                style={{ width: 32, height: 44, objectFit: "cover", flexShrink: 0,
                  border: "1px solid " + (i === page ? "#c8a96e" : "#222"),
                  cursor: "pointer", opacity: i === page ? 1 : 0.5 }}/>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Event detail panel ─────────────────────────────────────────────────────────
function EventDetail({ item, onClose }) {
  useEffect(() => {
    const fn = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const colour = item.subject === "James Luke" ? C.james
    : item.subject === "Luke family" ? C.family
    : C.john;

  return (
    <div className="lat-detail-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="lat-detail">
        <div className="lat-detail-pre" style={{ color: colour }}>
          {(item.subject || "John Luke") + " \u00b7 " + (item.dateLabel || item.year)}
        </div>
        <div className="lat-detail-body">{item.text}</div>
        {item.source && <div className="lat-detail-source">Source: {item.source}</div>}
        <button className="lat-detail-close" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

// ── Filter bar ─────────────────────────────────────────────────────────────────
function FilterBar({ filters, onChange }) {
  const btns = [
    { key: "john",    label: "John Luke",       c: C.john   },
    { key: "james",   label: "James\u2019 diary", c: C.james  },
    { key: "family",  label: "Family",           c: C.family },
    { key: "letters", label: "Letters",          c: C.letter },
    { key: "artworks",label: "Artworks",         c: "#6a6a6a"},
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

// ── Assign x slots for same-year items ────────────────────────────────────────
function spreadSameYear(items, getYear, minGap, getX) {
  // group by year, then spread within group
  const byYear = {};
  items.forEach((item, i) => {
    const y = getYear(item);
    if (!byYear[y]) byYear[y] = [];
    byYear[y].push({ item, i });
  });

  const result = new Array(items.length);
  Object.values(byYear).forEach(group => {
    const count = group.length;
    group.forEach(({ item, i }, gi) => {
      const baseX = getX(item);
      // spread: centre is baseX, offset by gi relative to middle
      const offset = (gi - (count - 1) / 2) * minGap;
      result[i] = { item, x: baseX + offset };
    });
  });
  return result;
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function LifeAndTimes() {
  const containerRef              = useRef(null);
  const [scrollX, setScrollX]     = useState(0);
  const [viewportW, setViewportW] = useState(window.innerWidth);
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [panel, setPanel]         = useState(null); // { type: "event"|"letter", data }
  const [hint, setHint]           = useState(true);
  const [filters, setFilters]     = useState({
    john: true, james: true, family: true, letters: true, artworks: true,
  });

  // Inject CSS
  useEffect(() => {
    const el = document.createElement("style");
    el.setAttribute("data-lat2", "1");
    el.textContent = CSS;
    document.head.appendChild(el);
    return () => document.querySelector("[data-lat2='1']")?.remove();
  }, []);

  // Fetch
  useEffect(() => {
    fetch("/api/life-and-times")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  // Scroll init + resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => { setScrollX(el.scrollLeft); setHint(el.scrollLeft < 40); };
    const onResize = () => setViewportW(el.clientWidth);
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    // Scroll to ~1895 — just before John's birth
    const target = yearToX(1895) - el.clientWidth * 0.18;
    el.scrollLeft = Math.max(0, target);
    setScrollX(el.scrollLeft);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [data]);

  // Drag
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

  // ── Render guards ──────────────────────────────────────────────────────────
  if (loading) return (
    <div className="lat-root" style={{ alignItems: "center", justifyContent: "center",
      color: "#2a2a2a", fontSize: "12px", letterSpacing: "3px" }}>
      Loading\u2026
    </div>
  );
  if (error) return (
    <div className="lat-root" style={{ alignItems: "center", justifyContent: "center",
      color: "#844", fontSize: "12px", padding: 40 }}>
      {error}
    </div>
  );

  const { events = [], artefacts = [], artworks = [] } = data || {};

  // ── Filter events ──────────────────────────────────────────────────────────
  const filteredEvents = events.filter(e => {
    if (e.subject === "John Luke"   && !filters.john)   return false;
    if (e.subject === "James Luke"  && !filters.james)  return false;
    if (e.subject === "Luke family" && !filters.family) return false;
    return true;
  });

  // ── Spread artworks — same year items fan out ──────────────────────────────
  const ART_GAP = 92;
  const artworkSpread = spreadSameYear(
    artworks.filter(w => filters.artworks && w.year >= START_YEAR && w.year <= END_YEAR),
    w => w.year,
    ART_GAP,
    w => yearToX(w.year)
  );
  // Assign rows by global index to stagger vertically
  const artworkItems = artworkSpread.map((s, i) => ({ ...s, rowIdx: i % 3 }));

  // ── Spread letters — same year fans out ───────────────────────────────────
  const letterItems = artefacts.filter(() => filters.letters);

  // ── Viewport culling ───────────────────────────────────────────────────────
  const visL = scrollX - VIEWPORT_PAD;
  const visR = scrollX + viewportW + VIEWPORT_PAD;

  const visEvents   = filteredEvents.filter(e => {
    const x = yearToX(e.year);
    return x >= visL && x <= visR;
  });
  const visLetters  = letterItems.filter(a => {
    const x = yearToX(a.year);
    return x >= visL && x <= visR;
  });
  const visArtworks = artworkItems.filter(a =>
    a.x >= visL && a.x <= visR
  );

  const currentYear = Math.round(xToYear(scrollX + viewportW / 2));

  // ── Build letter index per year for slight x offset ───────────────────────
  const letterCountByYear = {};
  letterItems.forEach(a => {
    letterCountByYear[a.year] = (letterCountByYear[a.year] || 0);
  });
  const letterIndexByArtefact = {};
  letterItems.forEach(a => {
    letterIndexByArtefact[a.artefactId] = letterCountByYear[a.year]++;
  });

  return (
    <div className="lat-root">
      {/* Top bar */}
      <div className="lat-bar">
        <div className="lat-nav">
          <Link to="/">John Luke</Link>
          <span className="lat-nav-sep"> · </span>
          <span className="lat-nav-title">Life &amp; Times</span>
        </div>
        <FilterBar filters={filters} onChange={handleFilter}/>
        <div className="lat-legend">
          {[
            { label: "John Luke",    c: C.john   },
            { label: "James\u2019 diary", c: C.james  },
            { label: "Family",       c: C.family },
            { label: "Letters",      c: C.letter },
          ].map(({ label, c }) => (
            <div key={label} className="lat-legend-item">
              <span className="lat-legend-dot" style={{ background: c }}/>
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Large year display */}
      <div className="lat-year">{currentYear}</div>

      {/* Scrollable canvas */}
      <div ref={containerRef} className="lat-scroll" onMouseDown={onMouseDown}>

        {/* SVG layer — axis, events, anchors */}
        <svg width={CANVAS_WIDTH} height={CANVAS_H}
          style={{ position: "absolute", top: 0, left: 0, display: "block", overflow: "visible" }}>
          <DecadeGhosts/>
          <BandSeparators/>
          <YearAxis scrollX={scrollX} viewportW={viewportW}/>
          <Anchors/>
          {visEvents.map((e, i) => (
            <EventMarker key={e.eventId || i}
              event={e} scrollX={scrollX} viewportW={viewportW}
              onClick={ev => setPanel({ type: "event", data: ev })}/>
          ))}
        </svg>

        {/* HTML layer — artworks + letters */}
        <div style={{ position: "absolute", top: 0, left: 0,
          width: CANVAS_WIDTH, height: CANVAS_H, pointerEvents: "none" }}>

          {/* Artworks */}
          {visArtworks.map((s, i) => (
            <ArtworkMarker key={s.item.artworkId || i}
              work={s.item} rowIndex={s.rowIdx} xPos={s.x}
              scrollX={scrollX} viewportW={viewportW}
              onClick={w => setPanel({ type: "artwork", data: w })}/>
          ))}

          {/* Letters */}
          {visLetters.map((a, i) => (
            <LetterMarker key={a.artefactId || i}
              artefact={a}
              index={letterIndexByArtefact[a.artefactId] || 0}
              scrollX={scrollX} viewportW={viewportW}
              onClick={ar => setPanel({ type: "letter", data: ar })}/>
          ))}
        </div>

        {/* Canvas spacer */}
        <div style={{ width: CANVAS_WIDTH, height: CANVAS_H }}/>
        {hint && <div className="lat-hint">Scroll or drag to move through time</div>}
      </div>

      {/* Panels */}
      {panel?.type === "letter" && (
        <LetterViewer artefact={panel.data} onClose={() => setPanel(null)}/>
      )}
      {(panel?.type === "event" || panel?.type === "artwork") && (
        <EventDetail
          item={panel.type === "artwork"
            ? { subject: "John Luke", year: panel.data.year,
                dateLabel: String(panel.data.year),
                text: panel.data.title, source: panel.data.medium }
            : panel.data}
          onClose={() => setPanel(null)}/>
      )}
    </div>
  );
}
