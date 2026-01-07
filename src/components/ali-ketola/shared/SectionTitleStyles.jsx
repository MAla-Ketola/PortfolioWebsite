// src/components/case-studies/ali-ketola/shared/SectionTitleStyles.jsx
import React from "react";

const GLYPHS = "01<>/\\|=+*#@$%&?";

export default function SectionTitleStyles() {
  return (
    <style>{`
/* H2 — near-white → magenta glow, subtle scanlines */
.hud-h2{
  --hud-r:232; --hud-g:240; --hud-b:255;
  display:inline-block; line-height:1;
  -webkit-text-stroke:.6px rgba(var(--hud-r),var(--hud-g),var(--hud-b),38);
  background:
    linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,255,255,0.78)),
    repeating-linear-gradient(0deg, rgba(255,255,255,0.08) 0 1px, transparent 1px 3px);
  -webkit-background-clip:text; background-clip:text; color:transparent;
  text-shadow:
    0 0 1px rgba(232,240,255,0.5),
    0 0 10px rgba(178,90,255,0.18),
    0 0 22px rgba(178,90,255,0.06);
  transition: background .25s, text-shadow .25s, -webkit-text-stroke-color .25s;
}
.hud-h2:hover{
  --hud-r:178; --hud-g:90; --hud-b:255; /* #B25AFF */
  text-shadow:
    1px 0 rgba(255,0,80,0.10),
    -1px 0 rgba(0,180,255,0.10),
    0 0 12px rgba(var(--hud-r),var(--hud-g),var(--hud-b),0.28),
    0 0 2px  rgba(var(--hud-r),var(--hud-g),var(--hud-b),0.85);
}

/* Magenta typed label */
.hud-label{
  --hud-r:178; --hud-g:90; --hud-b:255;
  display:inline-block; line-height:1;
  -webkit-text-stroke:.65px rgba(var(--hud-r),var(--hud-g),var(--hud-b),0.65);
  background:
    linear-gradient(180deg,
      rgba(var(--hud-r),var(--hud-g),var(--hud-b),1),
      rgba(var(--hud-r),var(--hud-g),var(--hud-b),0.88)),
    repeating-linear-gradient(0deg, rgba(255,255,255,0.08) 0 1px, transparent 1px 3px);
  -webkit-background-clip:text; background-clip:text; color:transparent;
  text-shadow:
    0 0 10px rgba(var(--hud-r),var(--hud-g),var(--hud-b),0.25),
    0 0 2px  rgba(var(--hud-r),var(--hud-g),var(--hud-b),0.85);
}

/* Typed mask + caret */
.type-title{ display:inline-flex; align-items:baseline; white-space:nowrap; }
.type-inner{
  position:relative; overflow:visible;
  -webkit-mask: linear-gradient(#000 0 0) left/0% 100% no-repeat;
          mask: linear-gradient(#000 0 0) left/0% 100% no-repeat;
}
.type-title[data-animate="true"] .type-inner{
  animation: typingMask var(--dur,900ms) steps(var(--chars)) var(--delay,0ms) both;
}
.type-inner::after{
  content:""; position:absolute; right:0; top:.06em; bottom:.06em; width:1px;
  background:
    linear-gradient(180deg, rgba(178,90,255,1), rgba(178,90,255,0.88)),
    repeating-linear-gradient(0deg, rgba(255,255,255,0.08) 0 1px, transparent 1px 3px);
  box-shadow: 0 0 .5px rgba(178,90,255,0.95), 0 0 8px rgba(178,90,255,0.35);
  animation: blink 1s step-end infinite; opacity:0;
}
.type-title[data-animate="true"] .type-inner::after{ opacity:1; }

@keyframes typingMask{ from { -webkit-mask-size:0% 100%; mask-size:0% 100%; } to { -webkit-mask-size:101% 100%; mask-size:101% 100%; } }
@keyframes blink { 50% { opacity:0 } }

@media (prefers-reduced-motion: reduce){
  .type-title[data-animate="true"] .type-inner{ animation:none!important; -webkit-mask:none; mask:none; }
  .type-inner::after{ animation:none!important; opacity:1; }
}

/* Panel helpers */
.panel{ position: relative; }
.panel::after{ content:""; position:absolute; inset:0; pointer-events:none; border-radius:inherit; box-shadow: inset 0 -1px rgba(178,90,255,0.55); }
    `}</style>
  );
}

export function ScrambleText({ text, duration = 450, delay = 0 }) {
  const spanRef = React.useRef(null);
  const [out, setOut] = React.useState(
    () => text.split("").map(() => GLYPHS[(Math.random() * GLYPHS.length) | 0]).join("")
  );
  const raf = React.useRef(null);
  const lastInView = React.useRef(false);

  const play = React.useCallback(() => {
    const prefersReduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (prefersReduce) { setOut(text); return; }

    setOut(text.split("").map(() => GLYPHS[(Math.random() * GLYPHS.length) | 0]).join(""));
    let startT;
    const tick = (t) => {
      if (!startT) startT = t;
      const p = Math.min(1, (t - startT) / duration);
      const reveal = Math.floor(p * text.length);
      const next = text.split("").map((ch, i) =>
        (i < reveal ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0])
      ).join("");
      setOut(next);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    const id = setTimeout(() => (raf.current = requestAnimationFrame(tick)), delay);
    return () => clearTimeout(id);
  }, [text, duration, delay]);

  React.useEffect(() => {
    const el = spanRef.current; if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        const inView = entry.isIntersecting;
        if (inView && !lastInView.current) play();
        lastInView.current = inView;
      },
      { root: null, threshold: 0.2, rootMargin: "-10% 0px -10% 0px" }
    );
    io.observe(el);
    return () => { io.disconnect(); if (raf.current) cancelAnimationFrame(raf.current); };
  }, [play]);

  return <span ref={spanRef} aria-label={text}>{out}</span>;
}

export function TypeTitle({ text, duration = 700, delay = 0, className = "" }) {
  const chars = text.length;
  const [animate, setAnimate] = React.useState(false);
  const hostRef = React.useRef(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const el = hostRef.current; if (!el) return;

    const play = () => {
      if (reduce) { setAnimate(false); return; }
      setAnimate(false);
      void el.offsetWidth; // restart animation
      setTimeout(() => setAnimate(true), delay);
    };
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && play(),
      { threshold: 0.35, rootMargin: "-10% 0px -10% 0px" }
    );
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
