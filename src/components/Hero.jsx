// HEROBACKUP.jsx — color-only update (Mono + Magenta)
// UI accent: #FF3DDE   •  Secondary magenta: #B25AFF  •  Neutrals unchanged
import React, { useEffect, useState, useCallback, useRef } from "react";
import { styles } from "../styles";
import MysteriousDeskCanvas from "./canvas/MysteriousDesk";

// === Effect timings (ms) ===
const BARS_DURATION_MS = 600;
const STATIC_DURATION_MS = 600;
const FLASH_DURATION_MS = 180; // quick CRT pop
const SETTLE_DURATION_MS = 500; // subtle scanline/vignette settle
const ABERR_DURATION_MS = 320; // subtle RGB split duration

function useBodyScrollLocked(locked) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = locked ? "hidden" : "";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
}

// --- Tiny “typewriter” block used in the hero panel ---
function BootType({ lines, speed = 22 }) {
  const [text, setText] = React.useState("");
  React.useEffect(() => {
    let i = 0,
      joined = lines.join("\n");
    const id = setInterval(() => {
      setText(joined.slice(0, i++));
      if (i > joined.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [lines, speed]);
  return (
    <pre
      className="p-3 md:p-4 text-[12px] md:text-sm leading-relaxed font-mono whitespace-pre-wrap"
      style={{ color: "#E8F0FF" }}
    >
      {text}
      <span
        className="inline-block w-2 h-4 align-[-2px] animate-pulse ml-1"
        style={{ backgroundColor: "#E8F0FF" }}
      />
    </pre>
  );
}

function ScrollCue({
  target = "#about",
  alignTo = "#hero-divider",
  fadeMs = 260,
  mode = "fixed", // "fixed" (desktop) | "inline" (mobile, under titles)
}) {
  const [mounted, setMounted] = React.useState(false);
  const [show, setShow] = React.useState(false);
  const [leftPx, setLeftPx] = React.useState(() => window.innerWidth / 2);
  const hideT = React.useRef(null);

  // Only compute left alignment when we're in fixed mode
  React.useEffect(() => {
    if (mode !== "fixed") return;

    const updateLeft = () => {
      const el = document.querySelector(alignTo);
      if (!el) {
        setLeftPx(window.innerWidth / 2);
        return;
      }
      const r = el.getBoundingClientRect();
      setLeftPx(r.left + r.width / 2);
    };
    updateLeft();
    window.addEventListener("resize", updateLeft, { passive: true });
    let ro;
    const el = document.querySelector(alignTo);
    if (el && "ResizeObserver" in window) {
      ro = new ResizeObserver(updateLeft);
      ro.observe(el);
    }
    return () => {
      window.removeEventListener("resize", updateLeft);
      ro?.disconnect();
    };
  }, [alignTo, mode]);

  const softShow = React.useCallback(() => {
    clearTimeout(hideT.current);
    setMounted(true);
    requestAnimationFrame(() => setShow(true));
  }, []);
  const softHide = React.useCallback(() => {
    setShow(false);
    clearTimeout(hideT.current);
    hideT.current = setTimeout(() => setMounted(false), fadeMs);
  }, [fadeMs]);

  React.useEffect(() => {
    const top = document.getElementById("hero-top-sentinel");
    const next = document.querySelector(target);
    if (!top) return;

    const topIO = new IntersectionObserver(
      ([e]) => {
        e.isIntersecting ? softShow() : softHide();
      },
      { threshold: 0.01 }
    );
    topIO.observe(top);

    let nextIO;
    if (next) {
      nextIO = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) softHide();
        },
        { threshold: 0.01 }
      );
      nextIO.observe(next);
    }

    const onScroll = () => {
      if (window.scrollY > 0) softHide();
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      topIO.disconnect();
      nextIO?.disconnect();
      window.removeEventListener("scroll", onScroll);
      clearTimeout(hideT.current);
    };
  }, [target, softShow, softHide]);

  if (!mounted) return null;

  return (
    <>
      <style>{`
        @keyframes cueFloat {
          0%,100% { transform: translateY(0); opacity:.75 }
          50%     { transform: translateY(-5px); opacity:1 }
        }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important } }
      `}</style>

      {mode === "fixed" ? (
        // Desktop (md+) — fixed near bottom, centered to #hero-divider
        <a
          href={target}
          onClick={() => softHide()}
          aria-label="Scroll to next section"
          className="hidden md:block fixed bottom-6 z-50 pointer-events-auto select-none transition-opacity"
          style={{
            left: `${leftPx}px`,
            transform: "translateX(-50%)",
            opacity: show ? 1 : 0,
            transition: `opacity ${fadeMs}ms ease`,
          }}
        >
          <span
            className="font-mono text-[12px] sm:text-[16px] uppercase tracking-widest"
            style={{
              color: "#B25AFF",
              textShadow: "0 0 10px rgba(255,61,222,.55)",
              animation: "cueFloat 2.2s ease-in-out infinite",
              display: "inline-block",
            }}
          >
            [ scroll ]
          </span>
        </a>
      ) : (
        // Mobile — inline block below titles, centered
        <a
          href={target}
          onClick={() => softHide()}
          aria-label="Scroll to next section"
          className="block md:hidden mx-auto mt-4 pointer-events-auto select-none transition-opacity text-center"
          style={{
            opacity: show ? 1 : 0,
            transition: `opacity ${fadeMs}ms ease`,
          }}
        >
          <span
            className="font-mono text-[12px] uppercase tracking-widest inline-block"
            style={{
              color: "#B25AFF",
              textShadow: "0 0 10px rgba(255,61,222,.55)",
              animation: "cueFloat 2.2s ease-in-out infinite",
            }}
          >
            [ scroll ]
          </span>
        </a>
      )}
    </>
  );
}

const GLYPHS = "01<>{}/\\|=+*#@$%&?♡";

const ScrambleText = React.forwardRef(function ScrambleText(
  { text, duration = 900, delay = 0 },
  ref
) {
  const spanRef = React.useRef(null);
  const [out, setOut] = React.useState(() =>
    text
      .split("")
      .map(() => GLYPHS[(Math.random() * GLYPHS.length) | 0])
      .join("")
  );
  const raf = React.useRef(null);
  const playing = React.useRef(false);
  const lastInView = React.useRef(false);
  const lastPlayAt = React.useRef(0);

  const play = React.useCallback(() => {
    const now = performance.now();
    if (now - lastPlayAt.current < 200 || playing.current) return;
    lastPlayAt.current = now;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    if (reduceMotion) {
      setOut(text);
      return;
    }

    playing.current = true;
    setOut(
      text
        .split("")
        .map(() => GLYPHS[(Math.random() * GLYPHS.length) | 0])
        .join("")
    );

    let startT;
    function tick(t) {
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
      else playing.current = false;
    }
    const id = setTimeout(
      () => (raf.current = requestAnimationFrame(tick)),
      delay
    );
    return () => clearTimeout(id);
  }, [text, duration, delay]);

  React.useImperativeHandle(ref, () => ({ play }), [play]);

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
});

function HackerTitleStyles() {
  return (
    <style>{`
      .hud-title{
        /* base = UI accent #FF3DDE */
         --hud-r:232; --hud-g:240; --hud-b:255;

        position:relative; display:inline-block;
        line-height:.92; letter-spacing:-0.01em;

        background:
         linear-gradient(180deg, rgba(var(--hud-r),var(--hud-g),var(--hud-b),0.95), rgba(var(--hud-r),var(--hud-g),var(--hud-b),0.75)),
          repeating-linear-gradient(0deg, rgba(255,255,255,.08) 0 1px, rgba(0,0,0,0) 1px 3px);
        -webkit-background-clip:text; background-clip:text; color:transparent;
        -webkit-text-stroke: 1px rgba(var(--hud-r),var(--hud-g),var(--hud-b),0.55);
        text-shadow:
          0 0 1px rgba(232,240,255,.60),
          0 0 12px rgba(178,90,255,.20),
          0 0 28px rgba(178,90,255,.08);
        filter: drop-shadow(0 0 12px rgba(var(--hud-r),var(--hud-g),var(--hud-b),.18));
        transition: background .25s ease, text-shadow .25s ease, -webkit-text-stroke-color .25s ease, filter .25s ease;
      }

      /* Hover = secondary magenta #B25AFF */
      .hud-title:hover{
        --hud-r:178; --hud-g:90; --hud-b:255;

        text-shadow:
          1px 0 rgba(255,0,80,.18),
          -1px 0 rgba(0,180,255,.18),
          0 0 18px rgba(var(--hud-r),var(--hud-g),var(--hud-b),.35),
          0 0 3px  rgba(var(--hud-r),var(--hud-g),var(--hud-b),.9);
      }

      @media (prefers-reduced-motion: reduce){ .hud-title{ transition:none } }
    `}</style>
  );
}

function TypeSubtitle({ start, speed = 28, delay = 150, className = "" }) {
  // Define the chunks so "Web" stays magenta while typing
  const segments = React.useMemo(
    () => [
      { text: "Software Developer — ", style: {} },
      { text: "Web", style: { color: "#B25AFF" } },
      { text: " · Games · UX", style: {} },
    ],
    []
  );

  // Precompute totals/offsets once
  const totalText = React.useMemo(
    () => segments.map((s) => s.text).join(""),
    [segments]
  );
  const offsets = React.useMemo(() => {
    const out = [];
    let acc = 0;
    for (const s of segments) {
      out.push(acc);
      acc += s.text.length;
    }
    return out;
  }, [segments]);

  const [i, setI] = React.useState(0);
  const [done, setDone] = React.useState(false);

  // Reset when start turns off (so it can replay cleanly)
  React.useEffect(() => {
    if (!start) {
      setI(0);
      setDone(false);
    }
  }, [start]);

  React.useEffect(() => {
    if (!start) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    if (reduce) {
      setI(totalText.length);
      setDone(true);
      return;
    }

    let id;
    const begin = () => {
      id = setInterval(() => {
        setI((prev) => {
          if (prev >= totalText.length) {
            clearInterval(id);
            setDone(true);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    };

    const delayId = setTimeout(begin, delay);
    return () => {
      clearInterval(id);
      clearTimeout(delayId);
    };
  }, [start, speed, delay, totalText.length]);

  return (
    <>
      <style>{`@keyframes caretBlink{0%,49%{opacity:1}50%,100%{opacity:0}}`}</style>
      <p className={className} style={{ whiteSpace: "nowrap" }}>
        {segments.map((seg, idx) => {
          const startAt = offsets[idx];
          const visible = Math.max(0, Math.min(i - startAt, seg.text.length));
          return (
            <span key={idx} style={seg.style}>
              {seg.text.slice(0, visible)}
            </span>
          );
        })}
        <span
          aria-hidden
          className="caret inline-block align-[-0.1em]"
          style={{
            width: "0.6ch",
            height: "1em",
            marginLeft: "2px",
            borderLeft: "2px solid #B25AFF",
            animation: "caretBlink 1s steps(1,end) infinite",
            opacity: done ? 0.6 : 1,
          }}
        />
      </p>
    </>
  );
}

function MobileMatchNavStyles() {
  return (
    <style>{`
      /* On mobile, give elements the same side gutters as the nav box */
      @media (max-width: 767.98px) {
        :root { --mobile-gutter: clamp(12px, 4vw, 24px); } /* tweak if your nav uses different insets */
        .mobile-match-nav {
          width: calc(100% - var(--mobile-gutter) * 2) !important;
          margin-left: var(--mobile-gutter) !important;
          margin-right: var(--mobile-gutter) !important;
        }
      }
    `}</style>
  );
}

export default function Hero({ onEntered, reenter3D = false }) {
  const [entered, setEntered] = useState(false);
  const [bars, setBars] = useState(false);
  const [staticNoise, setStaticNoise] = useState(false);
  const [flash, setFlash] = useState(false);
  const [settle, setSettle] = useState(false);
  const [aberr, setAberr] = useState(false);

  const marjutRef = React.useRef(null);
  const akaRef = React.useRef(null);

  const handleReplay = () => {
    marjutRef.current?.play();
    setTimeout(() => akaRef.current?.play(), 120);
  };

  const handleEnter = useCallback(() => {
    // 3D → UI transition sequence
    setBars(true);
    setTimeout(() => setStaticNoise(true), BARS_DURATION_MS);
    setTimeout(() => setFlash(true), BARS_DURATION_MS + STATIC_DURATION_MS);
    setTimeout(
      () => setSettle(true),
      BARS_DURATION_MS + STATIC_DURATION_MS + FLASH_DURATION_MS
    );
    setTimeout(() => {
      setAberr(true);
      setEntered(true);
      onEntered?.();
    }, BARS_DURATION_MS + STATIC_DURATION_MS + FLASH_DURATION_MS + SETTLE_DURATION_MS);
    setTimeout(() => setBars(false), BARS_DURATION_MS);
    setTimeout(
      () => setStaticNoise(false),
      BARS_DURATION_MS + STATIC_DURATION_MS
    );
    setTimeout(
      () => setFlash(false),
      BARS_DURATION_MS + STATIC_DURATION_MS + FLASH_DURATION_MS
    );
    setTimeout(
      () => setSettle(false),
      BARS_DURATION_MS +
        STATIC_DURATION_MS +
        FLASH_DURATION_MS +
        SETTLE_DURATION_MS
    );
    setTimeout(
      () => setAberr(false),
      BARS_DURATION_MS +
        STATIC_DURATION_MS +
        FLASH_DURATION_MS +
        SETTLE_DURATION_MS +
        ABERR_DURATION_MS
    );
  }, [onEntered]);

  // Optional: allow re-enter to replay 3D
  useEffect(() => {
    if (reenter3D) {
      setEntered(false);
      setBars(false);
      setStaticNoise(false);
      setFlash(false);
      setSettle(false);
      setAberr(false);
    }
  }, [reenter3D]);

  return (
    <section id="hero" className="relative w-full h-[110svh] overflow-hidden">
      <span
        id="hero-top-sentinel"
        aria-hidden="true"
        className="absolute top-0 left-0 w-px h-px pointer-events-none"
      />

      {/* Phase A: 3D scene */}
      {!entered && !bars && !staticNoise && !flash && !settle && !aberr && (
        <div className="fixed inset-0 z-30">
          <MysteriousDeskCanvas mode="forward" onEnterScreen={handleEnter} />

          <button
            onClick={handleEnter}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 px-4 py-2 rounded-md border border-white/15 text-[13px] tracking-wide bg-black/40 hover:bg-black/60 transition"
          >
            Enter
          </button>
        </div>
      )}

      {/* Step 1: horizontal bars */}
      {bars && (
        <>
          <style>{`
            @keyframes barsOn { 
              0%{opacity:0; transform:scaleY(0.94)} 
              12%{opacity:.85} 
              100%{opacity:.22; transform:scaleY(1)} 
            }
          `}</style>
          <div className="fixed inset-0 z-40 pointer-events-none">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "repeating-linear-gradient(0deg, rgba(255,255,255,.08) 0 2px, transparent 2px 5px)",
                animation: `barsOn ${BARS_DURATION_MS}ms ease-out forwards`,
                mixBlendMode: "screen",
                opacity: 0.6,
              }}
            />
          </div>
        </>
      )}

      {/* Step 2: static */}
      {staticNoise && (
        <>
          <style>{`
            @keyframes staticIn { 0%{opacity:0} 100%{opacity:1} }
          `}</style>
          <div className="fixed inset-0 z-45 pointer-events-none">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%222%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22 opacity=%220.16%22/></svg>')",
                animation: `staticIn ${STATIC_DURATION_MS}ms ease-out forwards`,
              }}
            />
          </div>
        </>
      )}

      {/* Step 3: flash + aberration settle */}
      {settle && (
        <>
          <style>{`
            @keyframes settleVignette { 0%{opacity:1} 100%{opacity:0.35} }
            @keyframes aberrC { 0%{filter:blur(1.2px)} 100%{filter:blur(.2px)} }
          `}</style>
          <div className="fixed inset-0 z-50 pointer-events-none">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(178,90,255,.25), transparent 60%)",
                mixBlendMode: "screen",
                animation: `settleVignette ${SETTLE_DURATION_MS}ms ease-out forwards`,
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(0,0,0,.45), transparent 60%)",
                filter: "blur(.7px)",
                animation: `aberrC ${ABERR_DURATION_MS}ms ease-out forwards`,
              }}
            />
          </div>
        </>
      )}

      {/* Step 4: CRT flash */}
      {flash && (
        <>
          <style>{`
            @keyframes flashPop { 0%{opacity:0} 15%{opacity:1} 70%{opacity:1} 100%{opacity:0} }
            @keyframes splitWobble { 0%{transform:translate(0,0)} 25%{transform:translate(1px,-1px)} 55%{transform:translate(-1px,1px)} 100%{transform:translate(0,0)} }
          `}</style>
          <div className="fixed inset-0 z-50 pointer-events-none">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(255,255,255,.8), rgba(255,255,255,0) 60%)",
                animation: `flashPop ${FLASH_DURATION_MS}ms ease-out forwards`,
                mixBlendMode: "screen",
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "repeating-linear-gradient(0deg, rgba(255,255,255,.05) 0 2px, transparent 2px 5px)",
                animation: `splitWobble ${FLASH_DURATION_MS}ms ease-in-out forwards`,
                opacity: 0.5,
              }}
            />
          </div>
        </>
      )}

      {/* Phase B: site content */}
      <div
        className={`absolute inset-0 top-[160px] z-10 pointer-events-none ${
          entered ? "opacity-100" : "opacity-0"
        }`}
        style={{ transition: "opacity 200ms ease" }}
      >
        {/* match Navbar container */}
        <div className={`mx-auto max-w-7xl ${styles.paddingX} relative`}>
          {/* center line for scroll-cue alignment */}
          <div
            id="hero-divider"
            className="hidden md:block absolute inset-y-0 left-1/2 w-px pointer-events-none"
            aria-hidden="true"
            style={{ background: "transparent" }}
          />

          {/* 1 col on mobile, 2 cols on md+ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 md:gap-y-10 md:gap-x-14 lg:gap-x-20 items-start pointer-events-auto">
            {/* Left: terminal boot panel */}
            <div className="w-full md:max-w-[560px] md:justify-self-start">
              <div
                className="w-full mb-4 md:mb-5 lg:mb-6 border bg-black/50 backdrop-blur-sm overflow-hidden"
                style={{
                  borderColor: "rgba(178,90,255,0.60)",
                  boxShadow:
                    "inset 0 0 0 1px rgba(178,90,255,0.15), 0 0 20px rgba(178,90,255,0.06)",
                }}
              >
                <div
                  className="flex items-center gap-2 px-3 py-2 border-b text-xs"
                  style={{
                    borderBottomColor: "rgba(178, 90, 255, 0.25)",
                    color: "rgba(178, 90, 255, 0.9)",
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: "rgba(178, 90, 255, 0.9)" }}
                  />
                  <span className="uppercase tracking-widest">/bin/boot</span>
                </div>
                <BootType
                  lines={[
                    "link eth0 up  —  OK",
                    "mount /portfolio  —  OK",
                    "start gpu: glitch-core  —  OK",
                    "start renderer: mysterious-desk  —  OK",
                    "hand-off to userland  —  READY",
                    "",
                    "$ whoami",
                    "marjut",
                    "",
                    "$ cat ~/hello.txt",
                    "Welcome inside the machine.",
                    "",
                    "$ _",
                  ]}
                />
              </div>
            </div>

            {/* Right: name + title */}
            <div className="self-start w-full md:justify-self-stretch">
              {/* Glow behind title */}
              <div
                className="pointer-events-none absolute -z-10 right-0 top-0 h-[52vmin] w-[52vmin]
           bg-[radial-gradient(circle_at_center,rgba(0,0,0,.28),transparent_60%)]"
                style={{ transform: "translate(12%, -6%)" }}
              />

              <div className="self-start">
                <HackerTitleStyles />
                <h1
                  className={`${styles.heroHeadText} w-full leading-[0.92] tracking-[-0.01em]
                  !text-[clamp(42px,12vw,70px)] sm:!text-[clamp(52px,12vw,84px)] md:!text-[min(9vw,85px)]`}
                  onMouseEnter={handleReplay}
                  onFocus={handleReplay}
                  tabIndex={0}
                >
                  <span className="hud-title">
                    <span className="block">
                      <ScrambleText
                        ref={marjutRef}
                        text="Marjut"
                        duration={900}
                      />
                    </span>
                    <span className="block">
                      <ScrambleText
                        ref={akaRef}
                        text="Ala-Ketola"
                        duration={1100}
                        delay={180}
                      />
                    </span>
                  </span>
                </h1>

                <TypeSubtitle
                  start={entered}
                  speed={28}
                  delay={180}
                  className={`${styles.heroSubText} mt-2 text-zinc-300/90 tracking-[-0.01em] [word-spacing:-0.12em] block whitespace-nowrap !text-[clamp(18px,2vw,26px)] sm:!text-[clamp(52px,12vw,84px)] md:!text-[min(9vw,22px)] !leading-tight`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ▼ Scroll cue (only after content is revealed) */}
      {entered && (
        <ScrollCue
          mode="fixed"
          target="#about"
          alignTo="#hero-divider"
          fadeMs={220}
        />
      )}
    </section>
  );
}
