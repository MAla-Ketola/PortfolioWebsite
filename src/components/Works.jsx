// Works.jsx — 3-up carousel (no peeking) with inter-page seam + equal card heights
import React from "react";
import { motion } from "framer-motion";

import { styles } from "../styles";
import { github } from "../assets";
import { SectionWrapper } from "../hoc";
import { projects } from "../constants";
import { fadeIn } from "../utils/motion";

/* =====================================
   Title FX (same family as About)
   ===================================== */

const GLYPHS = "01<>/\\|=+*#@$%&?";

function SectionTitleStyles() {
  return (
    <style>{`
      /* H2 — near-white → magenta glow, subtle scanlines */
      .hud-h2{
        --hud-r:232; --hud-g:240; --hud-b:255;
        display:inline-block; line-height:1;
        -webkit-text-stroke:.6px rgba(var(--hud-r),var(--hud-g),var(--hud-b),.38);
        background:
          linear-gradient(180deg, rgba(255,255,255,.98), rgba(255,255,255,.78)),
          repeating-linear-gradient(0deg, rgba(255,255,255,.08) 0 1px, transparent 1px 3px);
        -webkit-background-clip:text; background-clip:text; color:transparent;
        text-shadow:
          0 0 1px rgba(232,240,255,.50),
          0 0 10px rgba(178,90,255,.18),
          0 0 22px rgba(178,90,255,.06);
        transition: background .25s, text-shadow .25s, -webkit-text-stroke-color .25s;
      }
      .hud-h2:hover{
        --hud-r:178; --hud-g:90; --hud-b:255; /* #B25AFF */
        text-shadow:
          1px 0 rgba(255,0,80,.10),
          -1px 0 rgba(0,180,255,.10),
          0 0 12px rgba(var(--hud-r),var(--hud-g),var(--hud-b),.28),
          0 0 2px  rgba(var(--hud-r),var(--hud-g),var(--hud-b),.85);
      }

      /* HUD label (typed "WORKS") */
      .hud-label{
        --hud-r:178; --hud-g:90; --hud-b:255;
        display:inline-block; line-height:1;
        -webkit-text-stroke:.65px rgba(var(--hud-r),var(--hud-g),var(--hud-b),.65);
        background:
          linear-gradient(180deg, rgba(var(--hud-r),var(--hud-g),var(--hud-b),1),
                                   rgba(var(--hud-r),var(--hud-g),var(--hud-b),.88)),
          repeating-linear-gradient(0deg, rgba(255,255,255,.08) 0 1px, transparent 1px 3px);
        -webkit-background-clip:text; background-clip:text; color:transparent;
        text-shadow:
          0 0 10px rgba(var(--hud-r),var(--hud-g),var(--hud-b),.25),
          0 0 2px  rgba(var(--hud-r),var(--hud-g),var(--hud-b),.85);
      }

      /* Typed mask + caret */
      .type-title{ display:inline-flex; align-items:baseline; white-space:nowrap; }
      .type-inner{ position:relative; overflow:visible;
        -webkit-mask: linear-gradient(#000 0 0) left/0% 100% no-repeat;
                mask: linear-gradient(#000 0 0) left/0% 100% no-repeat; }
      .type-title[data-animate="true"] .type-inner{
        animation: typingMask var(--dur,900ms) steps(var(--chars)) var(--delay,0ms) both; }
      .type-inner::after{
        content:""; position:absolute; right:0; top:.06em; bottom:.06em; width:1px;
        background:
          linear-gradient(180deg, rgba(178,90,255,1), rgba(178,90,255,.88)),
          repeating-linear-gradient(0deg, rgba(255,255,255,.08) 0 1px, transparent 1px 3px);
        box-shadow: 0 0 .5px rgba(178,90,255,.95), 0 0 8px rgba(178,90,255,.35);
        animation: blink 1s step-end infinite; opacity:0;
      }
      .type-title[data-animate="true"] .type-inner::after{ opacity:1; }
      @keyframes typingMask{ from{ -webkit-mask-size:0% 100%; mask-size:0% 100% } to{ -webkit-mask-size:101% 100%; mask-size:101% 100% } }
      @keyframes blink{ 50%{ opacity:0 } }
      @media (prefers-reduced-motion: reduce){
        .type-title[data-animate="true"] .type-inner{ animation:none!important; -webkit-mask:none; mask:none; }
        .type-inner::after{ animation:none!important; opacity:1; }
      }

      /* ===========================
         Project image overlays
         =========================== */
      .ov{ position:absolute; inset:0; pointer-events:none; border-radius:inherit; }
      .hud-crt{ background: repeating-linear-gradient(0deg, rgba(255,255,255,.03) 0 1px, transparent 1px 3px); background-repeat:repeat; mix-blend-mode: overlay; box-shadow: inset 0 0 28px rgba(178,90,255,.16); opacity:.30; transition: opacity .2s ease, box-shadow .2s ease; }
      .group:hover .hud-crt{ opacity:.40; box-shadow: inset 0 0 32px rgba(178,90,255,.20); }
      .hud-ring{ z-index:30; box-shadow: inset 0 0 0 1px rgba(178,90,255,.32), 0 0 0 1px rgba(178,90,255,.22), 0 0 36px rgba(178,90,255,.12); transition: box-shadow .2s ease; }
      .group:hover .hud-ring{ box-shadow: inset 0 0 0 1px rgba(178,90,255,.45), 0 0 0 1px rgba(178,90,255,.28), 0 0 46px rgba(178,90,255,.16); }
      @media (min-resolution: 2dppx){ .hud-crt{ background-size:100% 2px; } }

      /* ===========================
         Carousel UI — mobile-friendly
         =========================== */
      .carousel-viewport{ overflow:hidden; position:relative; }
      .carousel-track{ display:flex; will-change: transform; }
      .carousel-page{ flex:0 0 100%; box-sizing: border-box; }

      .carousel-dots{ display:flex; align-items:center; gap:.5rem; justify-content:center; }
      .carousel-dot{ width:8px; height:8px; border:1px solid rgba(178,90,255,.45); background:rgba(178,90,255,.06); border-radius:9999px; }
      .carousel-dot[aria-current="true"]{ background:rgba(178,90,255,.75); box-shadow:0 0 12px rgba(178,90,255,.35); }

      @media (max-width: 639px){
        .carousel-dots{ gap:.4rem; }
        .carousel-dot{ width:7px; height:7px; }
      }

      /* ===========================
         Inter-page seam (gap) while keeping each page 100% width
         =========================== */
      .carousel{ --page-gap:16px; } /* base: matches gap-4 */
      @media (min-width:640px){ .carousel{ --page-gap:24px; } } /* sm+: matches gap-6 */
      .carousel-track{ gap: var(--page-gap); }
      @supports not (gap: 1px){
        .carousel-track > * + * { margin-left: var(--page-gap); }
      }

      /* Reinforce bottom edge on mobile (hairline can vanish on transforms) */
.panel{ position: relative; }
.panel::after{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  border-radius:inherit;
  /* a crisp inner bottom line so it always shows */
  box-shadow: inset 0 -1px rgba(178,90,255,.55);
}

/* Slightly stronger border on small screens for contrast */
@media (max-width: 639px){
  .panel{ border-color: rgba(178,90,255,.42) !important; }
}

    `}</style>
  );
}

function ScrambleText({ text, duration = 450, delay = 0 }) {
  const spanRef = React.useRef(null);
  const [out, setOut] = React.useState(() =>
    text
      .split("")
      .map(() => GLYPHS[(Math.random() * GLYPHS.length) | 0])
      .join("")
  );
  const raf = React.useRef(null);
  const lastInView = React.useRef(false);

  const play = React.useCallback(() => {
    const prefersReduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (prefersReduce) {
      setOut(text);
      return;
    }

    setOut(
      text
        .split("")
        .map(() => GLYPHS[(Math.random() * GLYPHS.length) | 0])
        .join("")
    );
    let startT;
    const tick = (t) => {
      if (!startT) startT = t;
      const p = Math.min(1, (t - startT) / duration);
      const reveal = Math.floor(p * text.length);
      const next = text
        .split("")
        .map((ch, i) =>
          i < reveal ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0]
        )
        .join("");
      setOut(next);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    const id = setTimeout(
      () => (raf.current = requestAnimationFrame(tick)),
      delay
    );
    return () => clearTimeout(id);
  }, [text, duration, delay]);

  React.useEffect(() => {
    const el = spanRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        const inView = entry.isIntersecting;
        if (inView && !lastInView.current) play();
        lastInView.current = inView;
      },
      { root: null, threshold: 0.2, rootMargin: "-10% 0px -10% 0px" }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [play]);

  return (
    <span ref={spanRef} aria-label={text}>
      {out}
    </span>
  );
}

function TypeTitle({ text, duration = 700, delay = 0, className = "" }) {
  const chars = [...text].length;
  const [animate, setAnimate] = React.useState(false);
  const hostRef = React.useRef(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    )?.matches;
    const el = hostRef.current;
    if (!el) return;

    const play = () => {
      if (reduce) {
        setAnimate(false);
        return;
      }
      setAnimate(false);
      void el.offsetWidth;
      setTimeout(() => setAnimate(true), delay);
    };

    const io = new IntersectionObserver(([e]) => e.isIntersecting && play(), {
      threshold: 0.35,
      rootMargin: "-10% 0px -10% 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, [text, delay, duration]);

  return (
    <span
      ref={hostRef}
      className={`type-title hud-label ${className}`}
      style={{ "--chars": chars, "--dur": `${duration}ms`, "--delay": "0ms" }}
      data-animate={animate}
      aria-label={text}
    >
      <span className="type-inner">{text}</span>
    </span>
  );
}

/* =====================================
   Panels — square corners + magenta borders (like About)
   ===================================== */

const EDGE = "rgba(178,90,255,0.30)"; // panel edge / chips edge
const DIVIDE = "rgba(178,90,255,0.25)"; // panel header divider
const SOFT = "rgba(178,90,255,0.06)"; // soft plate fill
const NEARWHITE = "rgba(232,240,255,0.92)";

const slugify = (s = "") =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// Panel
const Panel = ({ title, right, children, className = "" }) => (
  <div
    className={[
      "bg-black/50 backdrop-blur-sm overflow-hidden flex flex-col",
      "shadow-[0_0_40px_rgba(178,90,255,0.08)]",
      "border",
      "rounded-none",
      "panel",
      className,
    ].join(" ")}
    style={{ borderColor: EDGE, minHeight: "var(--card-h, auto)" }}
  >
    <div
      className="flex items-center gap-2 px-3 py-2 border-b text-xs"
      style={{ borderBottomColor: DIVIDE, color: "rgba(178,90,255,0.90)" }}
    >
      <span
        className="w-2 h-2 rounded-full"
        style={{
          backgroundColor: "rgba(178,90,255,0.85)",
          boxShadow: "0 0 10px rgba(178,90,255,0.6)",
        }}
      />
      <span className="uppercase tracking-widest">{title}</span>
      <div className="ml-auto">{right}</div>
    </div>
    <div className="p-4 md:p-5 flex-1 flex flex-col">{children}</div>
  </div>
);

const Tag = ({ children }) => (
  <span
    className="text-sm px-2.5 py-1.5 border"
    style={{ borderColor: EDGE, backgroundColor: SOFT, color: NEARWHITE }}
  >
    #{children}
  </span>
);

/*
 * IconButton — now renders an <a> when `href` is provided so taps
 * open reliably on iOS/Android (some mobile browsers block window.open).
 * We also add data-no-swipe to opt out from the carousel drag logic.
 */
const IconButton = ({ href, onClick, children, label, disabled, target = "_blank" }) => {
  const baseClass =
    "inline-flex items-center gap-2 px-2.5 py-1.5 rounded-none text-xs md:text-sm font-mono focus:outline-none focus:ring-2 cursor-pointer select-none";
  const baseStyle = {
    border: `1px solid ${EDGE}`,
    backgroundColor: SOFT,
    color: NEARWHITE,
    WebkitTapHighlightColor: "transparent",
  };

  const hoverHandlers = {
    onMouseEnter: (e) => (e.currentTarget.style.backgroundColor = "rgba(178,90,255,0.12)"),
    onMouseLeave: (e) => (e.currentTarget.style.backgroundColor = SOFT),
  };

  if (href && !disabled) {
    return (
      <a
        {...hoverHandlers}
        href={href}
        target={target}
        rel="noopener noreferrer"
        aria-label={label}
        role="button"
        className={baseClass}
        style={baseStyle}
        data-no-swipe
      >
        {children}
      </a>
    );
  }

  // Fallback: real <button>
  return (
    <button
      {...hoverHandlers}
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-label={label}
      className={baseClass + (disabled ? " opacity-40" : "")}
      style={baseStyle}
      data-no-swipe
    >
      {children}
    </button>
  );
};

const ProjectCard = ({
  index,
  name,
  description,
  tags = [],
  image,
  source_code_link,
  live_demo,
}) => {
  const slug = slugify(name);
  return (
    <motion.div
      variants={fadeIn("up", "spring", index * 0.12, 0.6)}
      className="h-full"
    >
      <Panel
        className="h-full project-card" // <- marked for measuring
        title={`/srv/projects/${slug}`}
        right={
          <div className="flex items-center gap-2">
            {source_code_link && (
              <IconButton
                href={source_code_link}
                label={`Open GitHub for ${name}`}
              >
                <img src={github} alt="" className="w-3.5 h-3.5" />
                Repo
              </IconButton>
            )}
            {live_demo && (
              <IconButton
                href={live_demo}
                label={`Open live demo for ${name}`}
              >
                ⏵ Demo
              </IconButton>
            )}
          </div>
        }
      >
        {image && (
          <div
            className="card-img group relative w-full aspect-[16/9] overflow-hidden shrink-0 rounded-none"
            style={{ border: `1px solid ${EDGE}`, isolation: "isolate" }}
          >
            <img
              src={image}
              alt={name}
              className="card-img w-full h-full object-cover relative z-0"
              loading="lazy"
              draggable="false"
            />
            <span className="ov hud-tint-project" aria-hidden="true" />
            <span className="ov hud-crt" aria-hidden="true" />
            <span className="ov hud-ring" aria-hidden="true" />
          </div>
        )}

        <div className="mt-4">
          <h3 className="font-mono text-[rgba(232,240,255,0.98)] text-[18px] md:text-[20px] font-semibold">
            {name}
          </h3>
          {description && (
            <p className="mt-2 font-mono text-[14px] leading-7 text-[rgba(232,240,255,0.88)]">
              {description}
            </p>
          )}
        </div>

        {!!tags.length && (
          <div className="mt-auto pt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Tag key={`${name}-${tag.name}`}>{tag.name}</Tag>
            ))}
          </div>
        )}
      </Panel>
    </motion.div>
  );
};

/* =====================================
   Carousel helpers — mobile-friendly
   ===================================== */

const chunk = (arr, size) =>
  arr.reduce((acc, _, i) => {
    if (i % size === 0) acc.push(arr.slice(i, i + size));
    return acc;
  }, []);

// Hook: responsive cards per page (1 on small screens, 3 otherwise)
function useResponsivePerPage() {
  const [perPage, setPerPage] = React.useState(3);
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(max-width: 639px)"); // Tailwind sm breakpoint
    const apply = () => setPerPage(mq.matches ? 1 : 3);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);
  return perPage;
}

/* NEW: Hook to equalize card heights across all pages */
function useEqualCardHeights(viewportRef, deps = []) {
  React.useLayoutEffect(() => {
    const root = viewportRef.current?.closest(".carousel");
    if (!root) return;

    const measure = () => {
      const cards = root.querySelectorAll(".project-card");
      let max = 0;
      cards.forEach((el) => {
        // natural content height (ignores existing minHeight)
        const h = el.scrollHeight;
        if (h > max) max = h;
      });
      if (max > 0) root.style.setProperty("--card-h", `${Math.ceil(max)}px`);
    };

    measure();

    const onResize = () => measure();
    window.addEventListener("resize", onResize);

    // re-measure when fonts finish loading (text metrics can change height)
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => measure()).catch(() => {});
    }

    // small async to catch late layout (e.g., after animations)
    const t = setTimeout(measure, 50);

    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", onResize);
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

const Works = () => {
  const isInteractiveEl = (el) =>
    el?.closest('a, button, input, textarea, select, [role="button"], [data-no-swipe]');

  const perPage = useResponsivePerPage();

  // Split projects into pages based on responsive perPage
  const pages = React.useMemo(() => chunk(projects, perPage), [perPage]);
  const pageCount = pages.length;
  const [page, setPage] = React.useState(0);

  // Keep current page in range if pageCount changes (e.g., due to resize)
  React.useEffect(() => {
    setPage((p) => Math.min(p, Math.max(0, pageCount - 1)));
  }, [pageCount]);

  // Reset to first page on layout switch (prevents offscreen blank during resize)
  React.useEffect(() => { setPage(0); }, [perPage]);

  // Keyboard navigation (← / →)
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") setPage((p) => Math.max(0, p - 1));
      if (e.key === "ArrowRight")
        setPage((p) => Math.min(pageCount - 1, p + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pageCount]);

  // Swipe/drag with direction-lock
  const viewportRef = React.useRef(null);
  const [dragPct, setDragPct] = React.useState(0);
  const drag = React.useRef({
    startX: 0,
    startY: 0,
    lastX: 0,
    active: false,
    lock: null,
  });

  const getX = (e) =>
    typeof e.clientX === "number" ? e.clientX : e.touches?.[0]?.clientX ?? 0;
  const getY = (e) =>
    typeof e.clientY === "number" ? e.clientY : e.touches?.[0]?.clientY ?? 0;

  const onPointerDown = (e) => {
    if (isInteractiveEl(e.target)) return; // <-- don't capture, don't drag
    const x = getX(e);
    const y = getY(e);
    drag.current = { startX: x, startY: y, lastX: x, active: true, lock: null };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!drag.current.active) return;
    if (isInteractiveEl(e.target)) return;
    const x = getX(e);
    const y = getY(e);

    if (drag.current.lock == null) {
      const dx = Math.abs(x - drag.current.startX);
      const dy = Math.abs(y - drag.current.startY);
      if (dx > 6 || dy > 6) drag.current.lock = dx > dy ? "x" : "y";
    }
    if (drag.current.lock !== "x") return;

    e.preventDefault();

    const dx = x - drag.current.startX;
    const vw = viewportRef.current?.offsetWidth || 1;
    setDragPct((dx / vw) * 100);
    drag.current.lastX = x;
  };

  const onPointerUp = (e) => {
    if (!drag.current.active) return;
    if (isInteractiveEl(e.target)) return;
    e.currentTarget.releasePointerCapture?.(e.pointerId);

    const totalDx = drag.current.lastX - drag.current.startX;
    const vw = viewportRef.current?.offsetWidth || 1;
    const moved = Math.abs(totalDx) / vw;

    if (moved > 0.18) {
      if (totalDx > 0) setPage((p) => Math.max(0, p - 1));
      else setPage((p) => Math.min(pageCount - 1, p + 1));
    }

    setDragPct(0);
    drag.current.active = false;
    drag.current.lock = null;
  };

  // Inter-page seam compensation
  const [seamPx, setSeamPx] = React.useState(0);
  React.useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const read = () => {
      const v =
        parseFloat(getComputedStyle(el).getPropertyValue("--page-gap")) || 0;
      setSeamPx(v);
    };
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, []);

  // NEW: Equalize card heights across pages
  useEqualCardHeights(viewportRef, [perPage, pageCount]);

  const goPrev = () => setPage((p) => Math.max(0, p - 1));
  const goNext = () => setPage((p) => Math.min(pageCount - 1, p + 1));

  return (
    <>
      <SectionTitleStyles />

      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <p className={`${styles.sectionSubText}`}>
          <TypeTitle text="WORKS" duration={650} delay={50} />
        </p>
        <h2 className={`${styles.sectionHeadText}`}>
          <span className="hud-h2">
            <ScrambleText text="Projects" duration={450} />
          </span>
        </h2>
      </motion.div>

      <div className="w-full flex">
        <motion.p
          variants={fadeIn("", "", 0.1, 1)}
          className="mt-3 font-mono text-[rgba(232,240,255,0.88)] text-[15px] max-w-3xl leading-7"
        >
          Experiments and case studies—focused on UX, UI, and implementation
          details—structure, performance, and accessibility.
        </motion.p>
      </div>

      {/* =========================
          Carousel
          ========================= */}
      <div
        className="mt-8 relative carousel"
        role="region"
        aria-roledescription="carousel"
        aria-label="Project carousel"
      >
        {/* Viewport */}
        <div
          ref={viewportRef}
          className="carousel-viewport select-none"
          style={{ touchAction: "pan-y" }} /* keep pages 100% width, no peek */
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div
            className="carousel-track transition-transform duration-500 ease-out"
            style={{
              transform: `translateX(calc(-${Math.min(page, pageCount - 1) * 100}% - ${Math.min(page, pageCount - 1) * seamPx}px + ${dragPct}%))`,
            }}
          >
            {pages.map((pageItems, pIdx) => (
              <div key={pIdx} className="carousel-page">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 items-stretch">
                  {pageItems.map((project, i) => (
                    <ProjectCard
                      key={`project-${pIdx}-${i}`}
                      index={pIdx * perPage + i}
                      {...project}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center sm:justify-between mt-4">
          <div className="hidden sm:block">
            <IconButton
              onClick={goPrev}
              disabled={page === 0}
              label="Previous projects"
            >
              ‹ Prev
            </IconButton>
          </div>
          <div
            className="carousel-dots"
            role="tablist"
            aria-label="Project pages"
          >
            {Array.from({ length: pageCount }).map((_, i) => (
              <button
                key={i}
                className="carousel-dot"
                aria-label={`Go to page ${i + 1}`}
                aria-current={i === page ? "true" : "false"}
                onClick={() => setPage(i)}
                style={{ outline: "none" }}
              />
            ))}
          </div>

          <div className="hidden sm:block">
            <IconButton
              onClick={goNext}
              disabled={page === pageCount - 1}
              label="Next projects"
            >
              Next ›
            </IconButton>
          </div>
        </div>
      </div>
    </>
  );
};

export default SectionWrapper(Works, "work");


