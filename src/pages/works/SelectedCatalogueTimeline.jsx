import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";

// ── Constants ─────────────────────────────────────────────────────────────────
const PX_PER_YEAR     = 800;   // horizontal scale
const START_YEAR      = 1920;
const END_YEAR        = 1975;
const CANVAS_PADDING  = 600;   // breathing room left and right
const CANVAS_WIDTH    = (END_YEAR - START_YEAR) * PX_PER_YEAR + CANVAS_PADDING * 2;
const AXIS_Y        = 540;   // timeline axis Y position
const VIEWPORT_PAD  = 800;   // render artworks within this px beyond viewport edge
// Two artwork bands: primary above, studies below primary
const PRIMARY_BAND  = { top: 60,  bottom: 300 };  // major works
const STUDY_BAND    = { top: 310, bottom: 490 };   // studies / secondary works

// Period palette — each period has a background gradient pair
const PERIOD_PALETTES = [
  { from: "#0a1628", to: "#0d1f35" },  // Early — deep navy
  { from: "#0d1f2d", to: "#112233" },  // Slade — midnight blue
  { from: "#111c1f", to: "#0d2020" },  // Return — dark teal
  { from: "#141414", to: "#1a1a14" },  // Mature — near black with warm undertone
  { from: "#1a1208", to: "#231a0a" },  // War Years — deep amber dark
  { from: "#0e1a14", to: "#101e18" },  // Post-war — dark green
  { from: "#18100e", to: "#201410" },  // Late — dark sienna
];

function yearToX(year) {
  return CANVAS_PADDING + (year - START_YEAR) * PX_PER_YEAR;
}

function xToYear(x) {
  return START_YEAR + (x - CANVAS_PADDING) / PX_PER_YEAR;
}

// Y position for artwork — uses correct band based on isStudy flag
function artworkY(yearIndex, isStudy) {
  const band = isStudy ? STUDY_BAND : PRIMARY_BAND;
  const rows = [0, 80, 40, 120, 20, 100];   // stagger within band
  const bandHeight = band.bottom - band.top - 160; // leave room for card
  return band.top + (rows[yearIndex % rows.length] / 120) * bandHeight;
}

// ── Artwork card on canvas ────────────────────────────────────────────────────
function ArtworkMarker({ work, index, yearIndex, scrollX, viewportW, onClick }) {
  const isStudy = !!work.isStudy;
  // Spread same-year artworks within their band symmetrically
  const CARD_SLOT = 280;  // card width (220) + gap (60)
  const side = yearIndex % 2 === 0 ? 1 : -1;
  const spreadDist = Math.ceil(yearIndex / 2);
  const offset = side * spreadDist * CARD_SLOT;
  const x = yearToX(work.yearFrom || 1940) + offset;
  const y = artworkY(yearIndex, isStudy);
  const [imgErr, setImgErr] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Distance from viewport centre → opacity
  const centreX   = scrollX + viewportW / 2;
  const dist      = Math.abs(x - centreX);
  const fadeStart = viewportW * 0.35;
  const fadeEnd   = viewportW * 0.65;
  const opacity   = dist < fadeStart
    ? 1
    : dist > fadeEnd
    ? 0
    : 1 - (dist - fadeStart) / (fadeEnd - fadeStart);

  const thumb = work.thumbnailUrl || work.imageUrl;
  const isVisible = opacity > 0.02;

  if (!isVisible) return null;

  return (
    <div
      className={`tl-artwork${isStudy ? " tl-artwork-study" : ""}`}
      style={{
        left: x,
        top: y,
        opacity: isStudy ? opacity * 0.82 : opacity,
        transform: `translateY(${(1 - opacity) * 18}px) scale(${0.94 + opacity * 0.06})`,
      }}
      onClick={() => onClick(work)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === "Enter" && onClick(work)}
    >
      <div className="tl-artwork-img">
        {thumb && !imgErr ? (
          <>
            <img
              src={thumb}
              alt={work.title}
              onError={() => setImgErr(true)}
              onLoad={() => setLoaded(true)}
              onContextMenu={e => e.preventDefault()}
              onDragStart={e => e.preventDefault()}
              style={{ opacity: loaded ? 1 : 0, transition: "opacity 0.4s" }}
            />
            <div className="tl-artwork-shield" />
          </>
        ) : (
          <div className="tl-artwork-placeholder">
            {work.artworkId?.replace("artwork-", "").toUpperCase() || "◎"}
          </div>
        )}
      </div>
      <div className="tl-artwork-caption">
        <div className="tl-artwork-title">{work.title || "Untitled"}</div>
        <div className="tl-artwork-year">{work.yearFrom || ""}</div>
      </div>
      <div className="tl-artwork-hint">View →</div>
    </div>
  );
}

// ── Life event marker — major John Luke events below axis ────────────────────
function LifeEventMarker({ event, scrollX, viewportW }) {
  const x = yearToX(event.year);
  const centreX = scrollX + viewportW / 2;
  const dist    = Math.abs(x - centreX);
  const opacity = Math.max(0, 1 - dist / (viewportW * 0.5));
  if (opacity < 0.03) return null;

  return (
    <div className="tl-event" style={{ left: x, opacity }}>
      <div className="tl-event-dot" />
      <div className="tl-event-line" />
      <div className="tl-event-body">
        <div className="tl-event-year">{event.year}</div>
        <div className="tl-event-text">{event.text}</div>
      </div>
    </div>
  );
}

// ── Exhibition marker on axis ─────────────────────────────────────────────────
function ExhibitionMarker({ ex, scrollX, viewportW }) {
  const year = ex.yearFrom || parseInt(ex.yearText) || null;
  if (!year) return null;
  const x = yearToX(year);

  const centreX = scrollX + viewportW / 2;
  const dist    = Math.abs(x - centreX);
  const opacity = Math.max(0, 1 - dist / (viewportW * 0.55));
  if (opacity < 0.03) return null;

  const isSolo = ex.exhibitionType === "Solo" || ex.exhibitionType === "SOLO" ||
                 ex.exhibitionType === "Retrospective" || ex.exhibitionType === "RETROSPECTIVE";

  return (
    <div
      className={`tl-exhibition ${isSolo ? "tl-exhibition-solo" : ""}`}
      style={{ left: x, opacity }}
    >
      <div className="tl-exhibition-dot" />
      <div className="tl-exhibition-line" />
      <div className="tl-exhibition-label">
        <div className="tl-exhibition-year">{year}</div>
        <div className="tl-exhibition-title">{ex.title}</div>
        {ex.venue && <div className="tl-exhibition-venue">{ex.venue}</div>}
      </div>
    </div>
  );
}


// ── Year tick marks ───────────────────────────────────────────────────────────
function YearTicks({ scrollX, viewportW }) {
  const startYear = Math.floor(xToYear(scrollX - viewportW)) - 1;
  const endYear   = Math.ceil(xToYear(scrollX + viewportW * 2)) + 1;
  const ticks = [];
  for (let y = Math.max(START_YEAR, startYear); y <= Math.min(END_YEAR, endYear); y++) {
    if (y % 5 === 0) {
      ticks.push(
        <div
          key={y}
          className={`tl-tick ${y % 10 === 0 ? "tl-tick-major" : ""}`}
          style={{ left: yearToX(y) }}
        >
          {y % 10 === 0 && <span className="tl-tick-label">{y}</span>}
        </div>
      );
    }
  }
  return <>{ticks}</>;
}

// ── Period band labels ────────────────────────────────────────────────────────
function PeriodBand({ period, index }) {
  const rawX = yearToX(period.yearFrom || START_YEAR);
  const rawW = ((period.yearTo || END_YEAR) - (period.yearFrom || START_YEAR)) * PX_PER_YEAR;
  // Clamp so bands that start before START_YEAR still show their label
  const x = Math.max(0, rawX);
  const w = rawW - (x - rawX);
  return (
    <div className="tl-period-band" style={{ left: x, width: w }}>
      <div className="tl-period-name">{period.name}</div>
    </div>
  );
}

// ── Main timeline component ───────────────────────────────────────────────────
export default function SelectedCatalogueTimeline() {
  const navigate = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const containerRef  = useRef(null);
  const [scrollX, setScrollX]       = useState(0);
  const [viewportW, setViewportW]   = useState(1200);
  const [isDragging, setIsDragging] = useState(false);
  const [bgStyle, setBgStyle]       = useState({});
  const velRef    = useRef(0);
  const rafRef    = useRef(null);
  const lastXRef  = useRef(null);
  const targetRef = useRef(0);
  const currentRef = useRef(0);

  // Load timeline data
  useEffect(() => {
    fetch("/api/timeline")
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        setData(d);
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  // Measure viewport
  useEffect(() => {
    const update = () => {
      if (containerRef.current) setViewportW(containerRef.current.clientWidth);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Smooth scroll animation loop
  const animateScroll = useCallback(() => {
    const diff = targetRef.current - currentRef.current;
    if (Math.abs(diff) < 0.5) {
      currentRef.current = targetRef.current;
      setScrollX(targetRef.current);
      rafRef.current = null;
      return;
    }
    currentRef.current += diff * 0.1;
    setScrollX(Math.round(currentRef.current));
    rafRef.current = requestAnimationFrame(animateScroll);
  }, []);

  const scrollTo = useCallback((target) => {
    const maxX = Math.max(0, CANVAS_WIDTH - viewportW);
    targetRef.current = Math.max(0, Math.min(maxX, target));
    if (!rafRef.current) rafRef.current = requestAnimationFrame(animateScroll);
  }, [viewportW, animateScroll]);

  // Wheel handler — vertical wheel → horizontal scroll
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      scrollTo(targetRef.current + delta * 1.8);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [scrollTo]);

  // Touch drag
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let startX = 0, startScroll = 0, lastTouch = 0, vel = 0;

    const onTouchStart = (e) => {
      startX = e.touches[0].clientX;
      startScroll = targetRef.current;
      lastTouch = startX;
      vel = 0;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const onTouchMove = (e) => {
      const dx = e.touches[0].clientX - startX;
      vel = e.touches[0].clientX - lastTouch;
      lastTouch = e.touches[0].clientX;
      const maxX = Math.max(0, CANVAS_WIDTH - viewportW);
      currentRef.current = Math.max(0, Math.min(maxX, startScroll - dx));
      targetRef.current = currentRef.current;
      setScrollX(currentRef.current);
    };
    const onTouchEnd = () => {
      // Momentum
      scrollTo(targetRef.current - vel * 8);
    };
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove",  onTouchMove,  { passive: true });
    el.addEventListener("touchend",   onTouchEnd);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove",  onTouchMove);
      el.removeEventListener("touchend",   onTouchEnd);
    };
  }, [scrollTo, viewportW]);

  // Background colour — interpolates between period palettes
  useEffect(() => {
    if (!data?.periods?.length) return;
    const currentYear = xToYear(scrollX + viewportW / 2);
    const periods = data.periods;
    let idx = periods.findIndex((p, i) => {
      const nextStart = periods[i + 1]?.yearFrom;
      return currentYear >= (p.yearFrom || 0) &&
             (nextStart === undefined || currentYear < nextStart);
    });
    if (idx < 0) idx = 0;
    const palette = PERIOD_PALETTES[idx % PERIOD_PALETTES.length];
    setBgStyle({ background: `linear-gradient(160deg, ${palette.from} 0%, ${palette.to} 100%)` });
  }, [scrollX, viewportW, data]);


  // ── Scoped stylesheet — injected on mount, removed on unmount ────────────
  useEffect(() => {
    const el = document.createElement('style');
    el.setAttribute('data-tl', '1');
    el.textContent = `
        .tl-root, .tl-root * { box-sizing: border-box; }

        .tl-root {
          position: fixed; inset: 0;
          overflow: hidden;
          cursor: ew-resize;
          user-select: none;
          transition: background 1.2s ease;
          font-family: 'Georgia', serif;
        }

        /* ── Top bar ── */
        .tl-topbar {
          position: absolute; top: 0; left: 0; right: 0;
          height: 64px;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 32px;
          background: linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%);
          z-index: 100;
        }
        .tl-topbar-left { display: flex; align-items: center; gap: 20px; }
        .tl-back {
          color: rgba(255,255,255,0.5); font-size: 0.96rem; text-decoration: none;
          letter-spacing: 0.06em; text-transform: uppercase;
          transition: color 0.2s;
        }
        .tl-back:hover { color: rgba(255,255,255,0.9); }
        .tl-title {
          color: rgba(255,255,255,0.85); font-size: 1rem;
          letter-spacing: 0.1em; text-transform: uppercase; font-family: Georgia, serif;
        }
        .tl-year-display {
          color: rgba(255,255,255,0.9); font-size: 2.2rem;
          font-family: Georgia, serif; font-weight: 400;
          letter-spacing: 0.05em; min-width: 80px; text-align: right;
          text-shadow: 0 2px 12px rgba(0,0,0,0.4);
        }

        /* ── Progress bar ── */
        .tl-progress {
          position: absolute; bottom: 0; left: 0; right: 0; height: 2px;
          background: rgba(255,255,255,0.08); z-index: 100;
        }
        .tl-progress-fill {
          height: 100%; background: rgba(255,255,255,0.3);
          transition: width 0.1s linear;
        }

        /* ── Canvas ── */
        .tl-canvas {
          position: absolute;
          top: 0; left: 0;
          width: ${CANVAS_WIDTH}px;
          height: 100%;
          will-change: transform;
        }

        /* ── Period bands ── */
        .tl-period-band {
          position: absolute;
          top: 0; height: ${AXIS_Y}px;
          border-left: 1px solid rgba(255,255,255,0.07);
          pointer-events: none;
        }
        .tl-period-name {
          position: absolute;
          top: 80px; left: 20px;
          font-size: 0.86rem;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: rgba(255,255,255,0.55);
          font-family: Georgia, serif;
          white-space: nowrap;
          pointer-events: none;
        }

        /* ── Axis ── */
        .tl-axis {
          position: absolute;
          left: 0; right: 0;
          top: ${AXIS_Y}px;
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.2) 5%, rgba(255,255,255,0.2) 95%, transparent);
          pointer-events: none;
        }

        /* ── Year ticks ── */
        .tl-tick {
          position: absolute;
          top: ${AXIS_Y}px;
          width: 1px;
          height: 6px;
          background: rgba(255,255,255,0.2);
          transform: translateX(-0.5px);
        }
        .tl-tick-major {
          height: 12px;
          background: rgba(255,255,255,0.35);
        }
        .tl-tick-label {
          position: absolute;
          top: 16px; left: 50%;
          transform: translateX(-50%);
          font-size: 1rem;
          color: rgba(255,255,255,0.3);
          letter-spacing: 0.04em;
          white-space: nowrap;
          font-family: Georgia, serif;
        }

        /* ── Artwork markers ── */
        .tl-artwork {
          position: absolute;
          width: 220px;
          transform-origin: center bottom;
          transition: transform 0.05s linear, opacity 0.05s linear;
          cursor: pointer;
        }
        .tl-artwork-img {
          width: 220px;
          aspect-ratio: 4/3;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          overflow: hidden;
          position: relative;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3);
          transition: box-shadow 0.3s, border-color 0.3s;
        }
        .tl-artwork:hover .tl-artwork-img {
          box-shadow: 0 24px 80px rgba(0,0,0,0.65), 0 8px 24px rgba(0,0,0,0.4);
          border-color: rgba(255,255,255,0.25);
        }
        .tl-artwork-img img {
          width: 100%; height: 100%; object-fit: cover; display: block;
          pointer-events: none; -webkit-user-drag: none;
        }
        .tl-artwork-shield { position: absolute; inset: 0; z-index: 2; }
        .tl-artwork-placeholder {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.15); font-size: 0.88rem;
          font-family: monospace; letter-spacing: 0.05em;
        }
        .tl-artwork-caption {
          padding: 10px 4px 4px;
          pointer-events: none;
        }
        .tl-artwork-title {
          font-size: 0.96rem; color: rgba(255,255,255,0.7);
          line-height: 1.3; font-style: italic;
          font-family: Georgia, serif;
        }
        .tl-artwork-year {
          font-size: 1rem; color: rgba(255,255,255,0.35);
          margin-top: 2px; letter-spacing: 0.04em;
        }
        .tl-artwork-hint {
          font-size: 0.8rem; color: rgba(255,255,255,0);
          letter-spacing: 0.08em; text-transform: uppercase;
          margin-top: 4px; transition: color 0.2s;
        }
        .tl-artwork:hover .tl-artwork-hint { color: rgba(255,255,255,0.45); }

        /* ── Study band separator ── */
        .tl-band-sep {
          position: absolute;
          top: ${STUDY_BAND.top - 10}px;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(to right,
            transparent,
            rgba(255,255,255,0.04) 10%,
            rgba(255,255,255,0.04) 90%,
            transparent
          );
          pointer-events: none;
        }
        .tl-band-label {
          position: fixed;
          left: 20px;
          font-size: 0.62rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.14);
          font-family: Georgia, serif;
          pointer-events: none;
          z-index: 5;
        }
        /* ── Study artwork — slightly smaller ── */
        .tl-artwork-study .tl-artwork-img {
          width: 180px;
        }
        .tl-artwork-study .tl-artwork-img img {
          width: 180px;
        }

        /* ── Vertical drop line from artwork to axis ── */
        .tl-artwork::after {
          content: '';
          position: absolute;
          bottom: -${AXIS_Y}px;
          left: 50%;
          width: 1px;
          height: 100px;
          background: linear-gradient(to bottom, rgba(255,255,255,0.08), transparent);
          pointer-events: none;
          transform: translateX(-50%);
        }

        /* ── Exhibition markers ── */
        .tl-exhibition {
          position: absolute;
          top: ${AXIS_Y}px;
          transform: translateX(-50%);
          pointer-events: none;
          display: flex; flex-direction: column; align-items: center;
        }
        .tl-exhibition-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: rgba(255,255,255,0.3);
          border: 1px solid rgba(255,255,255,0.5);
          margin-top: 8px;
          flex-shrink: 0;
        }
        .tl-exhibition-solo .tl-exhibition-dot {
          width: 9px; height: 9px;
          background: rgba(255,220,120,0.5);
          border-color: rgba(255,220,120,0.8);
          box-shadow: 0 0 8px rgba(255,220,120,0.4);
        }
        .tl-exhibition-line {
          width: 1px; height: 16px;
          background: rgba(255,255,255,0.15);
        }
        .tl-exhibition-solo .tl-exhibition-line {
          background: rgba(255,220,120,0.3);
          height: 20px;
        }
        .tl-exhibition-label {
          text-align: center;
          max-width: 140px;
        }
        .tl-exhibition-year {
          font-size: 0.96rem; color: rgba(255,255,255,0.3);
          letter-spacing: 0.06em; margin-bottom: 2px;
        }
        .tl-exhibition-solo .tl-exhibition-year { color: rgba(255,220,120,0.6); }
        .tl-exhibition-title {
          font-size: 1rem; color: rgba(255,255,255,0.4);
          line-height: 1.3; font-style: italic;
          font-family: Georgia, serif;
        }
        .tl-exhibition-solo .tl-exhibition-title { color: rgba(255,220,120,0.7); }
        .tl-exhibition-venue {
          font-size: 0.92rem; color: rgba(255,255,255,0.22);
          margin-top: 2px;
        }

        /* ── Current year needle ── */
        .tl-needle {
          position: absolute;
          top: 64px; bottom: 20px;
          left: 50%;
          width: 1px;
          background: linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.06) 40%, rgba(255,255,255,0.12) 70%, rgba(255,255,255,0.06) 100%);
          pointer-events: none;
          z-index: 50;
          transform: translateX(-0.5px);
        }

        /* ── Period selector dots ── */
        .tl-period-nav {
          position: absolute; bottom: 28px; left: 50%;
          transform: translateX(-50%);
          display: flex; gap: 10px; align-items: center;
          z-index: 100;
        }
        .tl-period-dot {
          width: 6px; height: 6px; border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.3);
          background: transparent;
          cursor: pointer; transition: all 0.2s;
          padding: 0;
        }
        .tl-period-dot.active {
          background: rgba(255,255,255,0.7);
          border-color: rgba(255,255,255,0.7);
          transform: scale(1.3);
        }
        .tl-period-dot:hover { border-color: rgba(255,255,255,0.6); }

        /* ── Instructions ── */
        .tl-instructions {
          position: absolute; bottom: 52px; left: 50%;
          transform: translateX(-50%);
          font-size: 0.8rem; color: rgba(255,255,255,0.25);
          letter-spacing: 0.1em; text-transform: uppercase;
          white-space: nowrap; pointer-events: none;
          z-index: 100;
          font-family: Georgia, serif;
        }


        /* ── Life event markers ── */
        .tl-event {
          position: absolute;
          top: ${AXIS_Y}px;
          transform: translateX(-50%);
          pointer-events: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 240px;
        }
        .tl-event-line {
          width: 1px;
          height: 12px;
          background: rgba(255,255,255,0.1);
          flex-shrink: 0;
        }
        .tl-event-major .tl-event-line {
          background: rgba(255,220,120,0.25);
          height: 18px;
        }
        .tl-event-dot {
          width: 4px; height: 4px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          flex-shrink: 0;
          margin-bottom: 8px;
        }
        .tl-event-major .tl-event-dot {
          width: 6px; height: 6px;
          background: rgba(255,220,120,0.4);
          box-shadow: 0 0 6px rgba(255,220,120,0.3);
        }
        .tl-event-body {
          text-align: center;
          padding: 0 8px;
        }
        .tl-event-year {
          font-size: 0.92rem;
          color: rgba(255,255,255,0.25);
          letter-spacing: 0.08em;
          margin-bottom: 4px;
          font-family: Georgia, serif;
        }
        .tl-event-major .tl-event-year {
          color: rgba(255,220,120,0.5);
        }
        .tl-event-text {
          font-size: 0.86rem;
          color: rgba(255,255,255,0.38);
          line-height: 1.5;
          font-family: Georgia, serif;
          font-style: italic;
          max-width: 220px;
        }
        .tl-event-major .tl-event-text {
          font-size: 0.92rem;
          color: rgba(255,255,255,0.55);
          font-weight: 400;
        }

        /* ── Loading / error states ── */
        .tl-loading {
          position: fixed; inset: 0;
          display: flex; align-items: center; justify-content: center;
          flex-direction: column; gap: 20px;
          background: #0a1628; color: rgba(255,255,255,0.5);
          font-family: Georgia, serif; font-size: 0.85rem; letter-spacing: 0.08em;
        }
        .tl-loading-bar {
          width: 200px; height: 1px;
          background: rgba(255,255,255,0.1);
          position: relative; overflow: hidden;
        }
        .tl-loading-fill {
          position: absolute; top: 0; left: 0; height: 100%;
          background: rgba(255,255,255,0.4);
          animation: tlLoad 1.4s ease-in-out infinite;
        }
        @keyframes tlLoad {
          0%   { width:0; left:0; }
          50%  { width:60%; left:20%; }
          100% { width:0; left:100%; }
        }
      `;
    document.head.appendChild(el);
    return () => { document.head.removeChild(el); };
  }, []);

  // Collect all artworks from all periods, sorted by year
  const allArtworks = (data?.periods || [])
    .flatMap(p => p.artworks || [])
    .filter(w => w.yearFrom)
    .sort((a, b) => a.yearFrom - b.yearFrom);

  // Split into primary and study bands — each gets its own yearIndex counter
  const primaryArtworks = allArtworks.filter(w => !w.isStudy);
  const studyArtworks   = allArtworks.filter(w => !!w.isStudy);

  const allExhibitions = (data?.exhibitions || [])
    .filter(ex => ex.yearFrom || ex.yearText);

  const allLifeEvents = (data?.lifeEvents || [])
    .filter(e => e.year)
    .sort((a, b) => a.year - b.year);



  const handleArtworkClick = (work) => {
    navigate(`/works/${work.artworkId}`);
  };

  const currentYear = Math.round(xToYear(scrollX + viewportW / 2));
  const progress = Math.max(0, Math.min(1, (scrollX) / Math.max(1, CANVAS_WIDTH - viewportW)));

  return (
    <div className="tl-root" style={bgStyle} ref={containerRef}>

      {/* Loading */}
      {loading && (
        <div className="tl-loading">
          <div className="tl-loading-bar"><div className="tl-loading-fill" /></div>
          <span>Loading catalogue</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="tl-loading">
          <span style={{ color: "rgba(255,100,100,0.7)" }}>Could not load: {error}</span>
          <Link to="/works" style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem" }}>← Back to Works</Link>
        </div>
      )}

      {/* Timeline */}
      {!loading && !error && data && (
        <>
          {/* Top bar */}
          <div className="tl-topbar">
            <div className="tl-topbar-left">
              <Link to="/works" className="tl-back">← Works</Link>
              <div className="tl-title">Selected Catalogue</div>
            </div>
            <div className="tl-year-display">{currentYear}</div>
          </div>

          {/* Viewport needle */}
          <div className="tl-needle" />

          {/* Scrolling canvas */}
          <div
            className="tl-canvas"
            style={{ transform: `translateX(${-scrollX}px)` }}
          >
            {/* Period bands */}
            {data.periods.map((p, i) => (
              <PeriodBand key={p.name || i} period={p} index={i} />
            ))}

            {/* Timeline axis */}
            <div className="tl-axis" />

            {/* Year ticks */}
            <YearTicks scrollX={scrollX} viewportW={viewportW} />

            {/* Exhibition markers */}
            {allExhibitions.map((ex, i) => (
              <ExhibitionMarker
                key={ex.exhibitionId || i}
                ex={ex}
                scrollX={scrollX}
                viewportW={viewportW}
              />
            ))}

            {/* Key life event markers */}
            {allLifeEvents.map((event, i) => (
              <LifeEventMarker
                key={"evt-" + (event.year) + "-" + i}
                event={event}
                scrollX={scrollX}
                viewportW={viewportW}
              />
            ))}


            {/* Band separator + labels */}
            <div className="tl-band-sep" />
            <div className="tl-band-label" style={{ top: PRIMARY_BAND.top + 2 }}>
              Works
            </div>
            <div className="tl-band-label" style={{ top: STUDY_BAND.top + 2 }}>
              Studies
            </div>

            {/* Primary artwork markers */}
            {(() => {
              const yearCount = {};
              return primaryArtworks.map((work, i) => {
                const yr = work.yearFrom;
                const yIdx = yearCount[yr] ?? 0;
                yearCount[yr] = yIdx + 1;
                return (
                  <ArtworkMarker
                    key={work.artworkId || i}
                    work={work}
                    index={i}
                    yearIndex={yIdx}
                    scrollX={scrollX}
                    viewportW={viewportW}
                    onClick={handleArtworkClick}
                  />
                );
              });
            })()}

            {/* Study / secondary artwork markers */}
            {(() => {
              const yearCount = {};
              return studyArtworks.map((work, i) => {
                const yr = work.yearFrom;
                const yIdx = yearCount[yr] ?? 0;
                yearCount[yr] = yIdx + 1;
                return (
                  <ArtworkMarker
                    key={work.artworkId || i}
                    work={work}
                    index={i}
                    yearIndex={yIdx}
                    scrollX={scrollX}
                    viewportW={viewportW}
                    onClick={handleArtworkClick}
                  />
                );
              });
            })()}
          </div>

          {/* Instructions */}
          <div className="tl-instructions">Scroll or drag to move through time</div>

          {/* Period nav dots */}
          {data.periods.length > 0 && (
            <div className="tl-period-nav">
              {data.periods.map((p, i) => {
                const midYear = ((p.yearFrom || START_YEAR) + (p.yearTo || END_YEAR)) / 2;
                const active = Math.abs(currentYear - midYear) <
                  ((p.yearTo || END_YEAR) - (p.yearFrom || START_YEAR)) / 2;
                return (
                  <button
                    key={p.name || i}
                    className={`tl-period-dot ${active ? "active" : ""}`}
                    title={p.name}
                    onClick={() => scrollTo(yearToX(p.yearFrom || START_YEAR) - viewportW / 4)}
                  />
                );
              })}
            </div>
          )}

          {/* Progress bar */}
          <div className="tl-progress">
            <div className="tl-progress-fill" style={{ width: `${progress * 100}%` }} />
          </div>
        </>
      )}
    </div>
  );
}
