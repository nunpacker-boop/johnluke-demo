import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "../../hooks/useSession.jsx";
import { Link, useNavigate } from "react-router-dom";

// ── Constants ─────────────────────────────────────────────────────────────────
const PX_PER_YEAR     = 1200;  // horizontal scale — wider for breathing room
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

// ── Medium filter groups ──────────────────────────────────────────────────────
const MEDIUM_GROUPS = [
  {
    id: "oil-tempera",
    label: "Oil & Tempera",
    color: "#c8935a",          // warm amber
    mediums: ["Oil and Tempera", "Oil", "Tempera", "Encaustic", "Distemper"],
  },
  {
    id: "watercolour",
    label: "Watercolour",
    color: "#6fa8c4",          // soft blue
    mediums: ["Watercolour", "Gouache", "Charcoal and Watercolour Wash"],
  },
  {
    id: "drawing",
    label: "Drawing",
    color: "#a8b89a",          // muted sage
    mediums: ["Pencil", "Coloured Pencil", "Charcoal", "Conté", "Wax Crayon",
              "Pastel", "Pen and Ink with Wash"],
  },
  {
    id: "print",
    label: "Print",
    color: "#b39ddb",          // soft violet
    mediums: ["Linocut", "Woodcut"],
  },
  {
    id: "sculpture",
    label: "Sculpture",
    color: "#c4a882",          // stone buff
    mediums: ["Sculpture"],
  },
  {
    id: "other",
    label: "Other",
    color: "#888888",          // neutral grey
    mediums: ["Mixed Media", "Unknown", null, undefined],
  },
];

// ── Theme filter groups ───────────────────────────────────────────────────────
const THEME_GROUPS = [
  { id: "Landscape",  label: "Landscape",  color: "#7aab6e" },
  { id: "Figure",     label: "Figure",     color: "#d4956a" },
  { id: "Portrait",   label: "Portrait",   color: "#c4a0c8" },
  { id: "Still Life", label: "Still Life", color: "#e8c97a" },
  { id: "Animal",     label: "Animal",     color: "#8bbcb0" },
  { id: "Religious",  label: "Religious",  color: "#b8a898" },
  { id: "Cityscape",  label: "Cityscape",  color: "#7a9ec4" },
  { id: "Decorative", label: "Decorative", color: "#c4b87a" },
];

function mediumGroup(medium) {
  for (const g of MEDIUM_GROUPS) {
    if (g.mediums.includes(medium)) return g;
  }
  return MEDIUM_GROUPS[MEDIUM_GROUPS.length - 1]; // fallback to Other
}

function yearToX(year) {
  return CANVAS_PADDING + (year - START_YEAR) * PX_PER_YEAR;
}

function xToYear(x) {
  return START_YEAR + (x - CANVAS_PADDING) / PX_PER_YEAR;
}

// Force-directed layout: spread cards to avoid overlap, grouped by year
// Works within the same year are spread as a cluster around their year centre.
// Returns map of { artworkId -> {x, y} }
const CARD_W = 220;
const CARD_H = 160;
const CARD_GAP = 28;     // horizontal gap between cards

function computeLayout(works, band) {
  if (!works.length) return {};
  const bandH = band.bottom - band.top - CARD_H;
  // Y stagger rows within band (normalised 0–1)
  const yRows = [0.05, 0.65, 0.35, 0.85, 0.18, 0.78, 0.5, 0.0, 0.92];

  // Group works by year
  const byYear = {};
  works.forEach((w, i) => {
    const yr = w.yearFrom || 1940;
    if (!byYear[yr]) byYear[yr] = [];
    byYear[yr].push({ w, globalIdx: i });
  });

  const map = {};

  Object.entries(byYear).forEach(([yrStr, group]) => {
    const yr = Number(yrStr);
    const centreX = yearToX(yr);
    const n = group.length;
    const totalW = n * CARD_W + (n - 1) * CARD_GAP;
    const startX = centreX - totalW / 2;

    group.forEach(({ w, globalIdx }, slotIdx) => {
      const x = startX + slotIdx * (CARD_W + CARD_GAP);
      const y = band.top + yRows[globalIdx % yRows.length] * bandH;
      map[w.artworkId] = { x, y };
    });
  });

  return map;
}

// ── Artwork card on canvas ────────────────────────────────────────────────────
function ArtworkMarker({ work, x, y, scrollX, viewportW, onClick }) {
  const isStudy = !!work.isStudy;
  const group   = mediumGroup(work.medium);
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
      <div className="tl-medium-dot" style={{ background: group.color }} title={group.label} />
    </div>
  );
}

// ── Hidden artwork dot — timelineVisible=false works ─────────────────────────
function HiddenArtworkDot({ work, x, y, scrollX, viewportW, onClick }) {
  const [hovered, setHovered] = useState(false);
  const group = THEME_GROUPS.find(g => g.id === work.theme) || { color: "#888888" };

  const centreX = scrollX + viewportW / 2;
  const dist    = Math.abs(x - centreX);
  const opacity = Math.max(0, 1 - dist / (viewportW * 0.55));
  if (opacity < 0.03) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: "translate(-50%, -50%)",
        zIndex: hovered ? 50 : 10,
        opacity,
        cursor: "pointer",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onClick(work)}
    >
      {/* The dot */}
      <div style={{
        width: hovered ? 14 : 9,
        height: hovered ? 14 : 9,
        borderRadius: "50%",
        background: group.color,
        border: hovered ? "2px solid rgba(255,255,255,0.8)" : "1px solid rgba(255,255,255,0.3)",
        transition: "all 0.15s",
        boxShadow: hovered ? `0 0 8px ${group.color}` : "none",
      }} />
      {/* Tooltip on hover */}
      {hovered && (
        <div style={{
          position: "absolute",
          bottom: "calc(100% + 8px)",
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(8,12,20,0.95)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 6,
          padding: "6px 10px",
          whiteSpace: "nowrap",
          pointerEvents: "none",
          backdropFilter: "blur(8px)",
        }}>
          <div style={{ color: "rgba(255,255,255,0.9)", fontSize: "0.8rem",
            fontFamily: "Georgia, serif", fontStyle: "italic", marginBottom: 2 }}>
            {work.title}
          </div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.7rem",
            letterSpacing: "0.05em" }}>
            {work.yearFrom || "Undated"} · {work.theme || ""}
          </div>
          <div style={{ color: group.color, fontSize: "0.65rem",
            marginTop: 3, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            View →
          </div>
        </div>
      )}
    </div>
  );
}

// ── Filter panel ─────────────────────────────────────────────────────────────
function FilterPanel({ activeFilters, onChange, onClose }) {
  const allOn = activeFilters.size === MEDIUM_GROUPS.length;

  const toggle = (id) => {
    const next = new Set(activeFilters);
    if (next.has(id)) { if (next.size > 1) next.delete(id); }
    else next.add(id);
    onChange(next);
  };

  const toggleAll = () => {
    onChange(allOn
      ? new Set([MEDIUM_GROUPS[0].id])
      : new Set(MEDIUM_GROUPS.map(g => g.id))
    );
  };

  return (
    <div className="tl-filter-panel">
      <div className="tl-filter-heading">Filter by medium</div>
      {MEDIUM_GROUPS.map(g => {
        const on = activeFilters.has(g.id);
        return (
          <div key={g.id} className="tl-filter-row" onClick={() => toggle(g.id)}>
            <div className={`tl-filter-swatch${on ? "" : " off"}`}
                 style={{ background: g.color }} />
            <span className={`tl-filter-label${on ? "" : " off"}`}>{g.label}</span>
            <span className="tl-filter-check">{on ? "✓" : ""}</span>
          </div>
        );
      })}
      <hr className="tl-filter-divider" />
      <div className="tl-filter-all" onClick={toggleAll}>
        {allOn ? "Hide all" : "Show all"}
      </div>
    </div>
  );
}

// ── Theme filter panel ───────────────────────────────────────────────────────
function ThemePanel({ activeThemes, onChange }) {
  const allOn = activeThemes.size === THEME_GROUPS.length;

  const toggle = (id) => {
    const next = new Set(activeThemes);
    if (next.has(id)) { if (next.size > 1) next.delete(id); }
    else next.add(id);
    onChange(next);
  };

  const toggleAll = () => {
    onChange(allOn
      ? new Set([THEME_GROUPS[0].id])
      : new Set(THEME_GROUPS.map(g => g.id))
    );
  };

  return (
    <div className="tl-filter-panel">
      <div className="tl-filter-heading">Filter by theme</div>
      {THEME_GROUPS.map(g => {
        const on = activeThemes.has(g.id);
        return (
          <div key={g.id} className="tl-filter-row" onClick={() => toggle(g.id)}>
            <div className={`tl-filter-swatch${on ? "" : " off"}`}
                 style={{ background: g.color }} />
            <span className={`tl-filter-label${on ? "" : " off"}`}>{g.label}</span>
            <span className="tl-filter-check">{on ? "✓" : ""}</span>
          </div>
        );
      })}
      <hr className="tl-filter-divider" />
      <div className="tl-filter-all" onClick={toggleAll}>
        {allOn ? "Hide all" : "Show all"}
      </div>
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
  // Session-based visibility overrides
  const { isHidden, setTimelineVisible, resetSession, hiddenCount, isReady: sessionReady } = useSession();

  const [activeFilters, setActiveFilters] = useState(
    new Set(MEDIUM_GROUPS.map(g => g.id))
  );
  const [activeThemes, setActiveThemes] = useState(
    new Set(THEME_GROUPS.map(g => g.id))
  );
  const [filterOpen, setFilterOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
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
          position: relative; min-width: 80px; text-align: right;
        }
        .tl-year-select {
          appearance: none; -webkit-appearance: none;
          background: transparent; border: none; outline: none;
          color: rgba(255,255,255,0.9); font-size: 2.2rem;
          font-family: var(--ff-hx, Georgia, serif); font-weight: 400;
          letter-spacing: 0.05em; text-align: right;
          text-shadow: 0 2px 12px rgba(0,0,0,0.4);
          cursor: pointer; padding-right: 4px;
          text-align-last: right;
          font-style: italic;
        }
        .tl-year-select:hover { color: white; }
        .tl-year-select option {
          background: #1a1a2e; color: white;
          font-size: 1rem; font-family: var(--ff-hx, Georgia, serif);
          font-style: normal;
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

        /* ── Filter controls in topbar ── */
        .tl-topbar-filters {
          display: flex; align-items: center; gap: 8px;
          position: absolute; left: 50%; transform: translateX(-50%);
        }
        .tl-filter-wrap { position: relative; }
        .tl-filter-pill {
          height: 30px; padding: 0 14px;
          border: 1px solid rgba(255,255,255,0.18);
          border-radius: 15px;
          background: rgba(0,0,0,0.25);
          color: rgba(255,255,255,0.55); font-size: 0.75rem;
          letter-spacing: 0.06em; text-transform: uppercase;
          cursor: pointer; transition: all 0.2s;
          font-family: Georgia, serif;
          backdrop-filter: blur(4px);
          white-space: nowrap;
        }
        .tl-filter-pill:hover { color: rgba(255,255,255,0.9);
          border-color: rgba(255,255,255,0.4);
          background: rgba(0,0,0,0.4); }
        .tl-filter-pill.open { color: white;
          border-color: rgba(255,255,255,0.5);
          background: rgba(255,255,255,0.12); }
        .tl-filter-pill.active { color: rgba(255,220,120,0.9);
          border-color: rgba(255,220,120,0.4); }
        .tl-reset-btn {
          height: 30px; padding: 0 12px;
          border: none; background: none;
          color: rgba(255,255,255,0.3); font-size: 0.72rem;
          letter-spacing: 0.05em; cursor: pointer;
          font-family: Georgia, serif; font-style: italic;
          transition: color 0.2s;
        }
        .tl-reset-btn:hover { color: rgba(255,255,255,0.7); }

        .tl-filter-panel {
          position: absolute; left: 0; top: calc(100% + 10px);
          transform: none;
          background: rgba(8,12,20,0.92);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          padding: 16px 18px;
          z-index: 300;
          min-width: 180px;
          backdrop-filter: blur(12px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
          animation: tlFadeIn 0.15s ease;
        }
        @keyframes tlFadeIn { from { opacity:0; transform:translateY(-4px); }
                              to   { opacity:1; transform:translateY(0); } }
        .tl-filter-heading {
          font-size: 0.62rem; letter-spacing: 0.12em; text-transform: uppercase;
          color: rgba(255,255,255,0.35); margin-bottom: 12px;
        }
        .tl-filter-row {
          display: flex; align-items: center; gap: 10px;
          padding: 5px 0; cursor: pointer; user-select: none;
        }
        .tl-filter-row:hover .tl-filter-label { color: white; }
        .tl-filter-swatch {
          width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
          transition: opacity 0.15s;
        }
        .tl-filter-swatch.off { opacity: 0.2; }
        .tl-filter-label {
          font-size: 0.8rem; color: rgba(255,255,255,0.6);
          transition: color 0.15s; flex: 1;
        }
        .tl-filter-label.off { color: rgba(255,255,255,0.25); }
        .tl-filter-check {
          font-size: 0.7rem; color: rgba(255,255,255,0.4);
          width: 14px; text-align: center;
        }
        .tl-filter-divider {
          border: none; border-top: 1px solid rgba(255,255,255,0.08);
          margin: 10px 0;
        }
        .tl-filter-all {
          font-size: 0.72rem; color: rgba(255,255,255,0.35);
          cursor: pointer; text-align: center; padding-top: 2px;
          letter-spacing: 0.04em;
          transition: color 0.15s;
        }
        .tl-filter-all:hover { color: rgba(255,255,255,0.7); }

        /* theme panel uses same .tl-filter-panel styles */

        /* ── Medium colour dot on artwork card ── */
        .tl-medium-dot {
          width: 7px; height: 7px; border-radius: 50%;
          position: absolute; top: 7px; right: 7px;
          opacity: 0.75;
        }
        /* ── Filtered-out artworks show as dots ── */
        .tl-artwork-dot {
          position: absolute;
          width: 8px; height: 8px; border-radius: 50%;
          transform: translate(-50%, -50%);
          opacity: 0.25;
          pointer-events: none;
          transition: opacity 0.2s;
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

  // Split into primary and study bands
  const primaryArtworks = allArtworks.filter(w => !w.isStudy);
  const studyArtworks   = allArtworks.filter(w => !!w.isStudy);

  // Compute force-directed layouts for each band
  const primaryLayout = computeLayout(primaryArtworks, PRIMARY_BAND);
  const studyLayout   = computeLayout(studyArtworks,   STUDY_BAND);

  // Works hidden by this visitor's session override, or by global timelineVisible=false
  const isWorkHidden = (w) => w.timelineVisible === false || isHidden(w.artworkId);
  const hiddenPrimary = primaryArtworks.filter(isWorkHidden);
  const hiddenStudy   = studyArtworks.filter(isWorkHidden);

  // Filter artworks by active medium groups AND theme (only visible works)
  const filterWork = (w) => {
    if (isWorkHidden(w)) return false;
    const g = mediumGroup(w.medium);
    const themeMatch = !w.theme || activeThemes.has(w.theme);
    return activeFilters.has(g.id) && themeMatch;
  };
  const visiblePrimary = primaryArtworks.filter(filterWork);
  const visibleStudy   = studyArtworks.filter(filterWork);

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

            {/* Filter controls — centre of topbar */}
            <div className="tl-topbar-filters">
              <div className="tl-filter-wrap">
                <button
                  className={`tl-filter-pill${filterOpen ? " open" : ""}${activeFilters.size < MEDIUM_GROUPS.length ? " active" : ""}`}
                  onClick={() => { setFilterOpen(o => !o); setThemeOpen(false); }}
                >
                  Medium{activeFilters.size < MEDIUM_GROUPS.length ? ` · ${activeFilters.size}` : ""}
                </button>
                {filterOpen && (
                  <FilterPanel
                    activeFilters={activeFilters}
                    onChange={setActiveFilters}
                    onClose={() => setFilterOpen(false)}
                  />
                )}
              </div>
              <div className="tl-filter-wrap">
                <button
                  className={`tl-filter-pill${themeOpen ? " open" : ""}${activeThemes.size < THEME_GROUPS.length ? " active" : ""}`}
                  onClick={() => { setThemeOpen(o => !o); setFilterOpen(false); }}
                >
                  Theme{activeThemes.size < THEME_GROUPS.length ? ` · ${activeThemes.size}` : ""}
                </button>
                {themeOpen && (
                  <ThemePanel
                    activeThemes={activeThemes}
                    onChange={setActiveThemes}
                  />
                )}
              </div>
              {hiddenCount > 0 && (
                <button
                  className="tl-reset-btn"
                  onClick={resetSession}
                  title="Reset your timeline view to defaults"
                >
                  ↺ Reset view ({hiddenCount} hidden)
                </button>
              )}
            </div>

            <div className="tl-year-display">
              <select
                className="tl-year-select"
                value={currentYear}
                onChange={e => scrollTo(yearToX(Number(e.target.value)) - viewportW / 2)}
              >
                {Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, i) => START_YEAR + i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
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

            {/* Hidden artworks (timelineVisible=false) — interactive theme dots */}
            {hiddenPrimary.map((work, i) => {
              const pos = primaryLayout[work.artworkId];
              if (!pos) return null;
              return (
                <HiddenArtworkDot
                  key={"hidden-" + (work.artworkId || i)}
                  work={work}
                  x={pos.x + CARD_W / 2}
                  y={pos.y + CARD_H / 2}
                  scrollX={scrollX}
                  viewportW={viewportW}
                  onClick={handleArtworkClick}
                />
              );
            })}
            {hiddenStudy.map((work, i) => {
              const pos = studyLayout[work.artworkId];
              if (!pos) return null;
              return (
                <HiddenArtworkDot
                  key={"hidden-study-" + (work.artworkId || i)}
                  work={work}
                  x={pos.x + CARD_W / 2}
                  y={pos.y + CARD_H / 2}
                  scrollX={scrollX}
                  viewportW={viewportW}
                  onClick={handleArtworkClick}
                />
              );
            })}

            {/* Primary artwork markers — full cards for visible, dots for filtered-out */}
            {primaryArtworks.map((work, i) => {
              const pos = primaryLayout[work.artworkId];
              if (!pos) return null;
              const visible = filterWork(work);
              if (!visible) {
                const g = mediumGroup(work.medium);
                return (
                  <div key={work.artworkId || i} className="tl-artwork-dot"
                    style={{ left: pos.x + 110, top: pos.y + 80, background: g.color }} />
                );
              }
              return (
                <ArtworkMarker
                  key={work.artworkId || i}
                  work={work}
                  x={pos.x}
                  y={pos.y}
                  scrollX={scrollX}
                  viewportW={viewportW}
                  onClick={handleArtworkClick}
                />
              );
            })}

            {/* Study / secondary artwork markers */}
            {studyArtworks.map((work, i) => {
              const pos = studyLayout[work.artworkId];
              if (!pos) return null;
              const visible = filterWork(work);
              if (!visible) {
                const g = mediumGroup(work.medium);
                return (
                  <div key={work.artworkId || i} className="tl-artwork-dot"
                    style={{ left: pos.x + 110, top: pos.y + 80, background: g.color }} />
                );
              }
              return (
                <ArtworkMarker
                  key={work.artworkId || i}
                  work={work}
                  x={pos.x}
                  y={pos.y}
                  scrollX={scrollX}
                  viewportW={viewportW}
                  onClick={handleArtworkClick}
                />
              );
            })}
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
