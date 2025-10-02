import React from "react";
import { motion } from "framer-motion";
import { styles } from "../styles";
import { technologies } from "../constants";
import { SectionWrapper } from "../hoc";
import headshot from "../assets/headshot2.png";

/* ===== Styles (trimmed) ===== */
const GLYPHS = "01<>{}/\\|=+*#@$%&?";

export function SectionTitleStyles() {
  return (
    <style>{`
/* ===== HUD portrait overlay (stack-safe) ===== */
.hud-figure{
  position:relative;
  overflow:hidden;
  isolation:isolate;
  --grid-gap:10px; --gridW:2px;
  --gridX: rgba(178,90,255,.28);
  --gridY: rgba(178,90,255,.30);
  --vig: rgba(0,0,0,.62);
  --sweep-s:8s;
}

/* Force any legacy ::before/::after on the figure to sit UNDER our stack */
.hud-figure::before,
.hud-figure::after{
  position:absolute;
  inset:0;
  z-index:0 !important;
}

/* New inner stack that always sits above pseudo-elements */
.hud-stack{
  position:absolute;
  inset:0;
  z-index:10;               /* higher than ::before/::after */
}

.hud-img{
  position:absolute;
  inset:0;
  width:100%; height:100%;
  object-fit:cover;
  object-position:50% var(--obj-y,28%);
  z-index:11;
  filter:contrast(1.06) saturate(1.12) brightness(1.02);
  -webkit-user-drag:none; user-select:none;
}

.ov{ position:absolute; inset:0; pointer-events:none; z-index:12; }
.hud-corner{ position:absolute; z-index:20; }

/* CRT scanlines + inner glow (same as boot box) */
.hud-crt{
  background: repeating-linear-gradient(0deg, rgba(255,255,255,.03) 0 1px, transparent 1px 3px);
  box-shadow: inset 0 0 28px rgba(178,90,255,.10);
}

.hud-tint{
  background:
    radial-gradient(120% 120% at 50% 8%, rgba(178,90,255,.16) 0%, rgba(178,90,255,.08) 40%, rgba(0,0,0,0) 70%),
    linear-gradient(0deg, rgba(178,90,255,var(--tintA,.18)), rgba(178,90,255,var(--tintA,.20)));
  mix-blend-mode: color;  /* try: screen / overlay / color */
  opacity: var(--tintO, 1);
  border-radius: inherit;
}

.hud-rgb{position:absolute; inset:0; mix-blend-mode:screen; opacity:.22; will-change:transform;}
.hud-rgb.r{ filter:hue-rotate(310deg) saturate(1.4); animation:rgbJitter 6s infinite steps(60); transform:translateX(1px);}
.hud-rgb.c{ filter:hue-rotate(180deg) saturate(1.4); animation:rgbJitter 6s infinite reverse steps(60); transform:translateX(-1px);}
@keyframes rgbJitter{ 50%{ transform:translate(0,0);} }

/* Holographic diagonal sweep */
.hud-sweep{
  position:absolute; inset:0; pointer-events:none; border-radius:inherit;
  overflow:hidden;                 /* clips the sweep at the frame */
}
.hud-sweep::before{
  content:"";
  position:absolute;
  top:-25%; left:-25%; width:150%; height:150%; /* oversize so edges don't show */
  background: linear-gradient(115deg,
              transparent 35%,
              rgba(255,255,255,.08) 50%,
              transparent 65%);
  mix-blend-mode: screen;          /* brightens without washing out */
  transform: translateX(-120%);    /* start off-frame */
  animation: hudSweep 4.5s linear infinite;
  will-change: transform;
}
@keyframes hudSweep{
  to { transform: translateX(120%); }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce){
  .hud-sweep::before{ animation: none; }
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

    const io = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && play(),
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

const Panel = ({ title, children, pad = true }) => (
  <div
    className="border bg-black/50 backdrop-blur-sm shadow-[0_0_40px_rgba(178,90,255,.08)] overflow-hidden h-full flex flex-col"
    style={{ borderColor: "rgba(178,90,255,0.30)" }}
  >
    <div
      className="flex items-center gap-2 px-3 py-2 border-b text-xs"
      style={{
        borderBottomColor: "rgba(178,90,255,0.25)",
        color: "rgba(178,90,255,0.90)",
      }}
    >
      <span
        className="w-2 h-2 rounded-full"
        style={{
          backgroundColor: "rgba(178,90,255,0.85)",
          boxShadow: "0 0 10px rgba(178,90,255,.6)",
        }}
      />
      <span className="uppercase tracking-widest">{title}</span>
    </div>
    <div className={pad ? "p-4 md:p-4 flex-1" : "flex-1"}>{children}</div>
  </div>
);

const Chip = ({ children }) => (
  <span
    className="text-sm px-2 py-1 border"
    style={{
      borderColor: "rgba(178,90,255,0.30)",
      backgroundColor: "rgba(178,90,255,0.06)",
      color: "rgba(229,231,235,0.92)",
    }}
  >
    {children}
  </span>
);

const About = () => {
  const focus = ["Web", "Mobile", "UX", "AI", "Games",];
  const learning = [
    "JavaScript",
    "React",
    "Three.js",
    "React Three Fiber",
    "Framer Motion",
    "Tailwind",
    "Appwrite",
    "Vite",
  ];

  return (
    <>
      <SectionTitleStyles />
      <div>
        <p className={`${styles.sectionSubText}`}>
          <TypeTitle text="INTRODUCTION" />
        </p>
        <h2 className={`${styles.sectionHeadText}`}>
          <span className="hud-h2">
            <ScrambleText text="About" />
          </span>
        </h2>
      </div>

      {/* Shared portrait height variable */}
      <div
        className="mt-8 grid grid-cols-1 md:grid-cols-[1fr_minmax(320px,420px)_1fr] gap-6 items-start"
        style={{ ["--ph"]: "clamp(500px, 60vh, 660px)" }}
      >
        {/* About (left) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ height: "var(--ph)" }}
        >
          <Panel title="/etc/about">
            <p className="font-mono text-[15px] leading-7 text-zinc-200/90">
              I started in hospitality and graduated in Games Technology. Now I’m focused on my own projects—exploring UX, AI, and game-inspired interactions—with the aim of stepping into a junior software developer role. Tools I’m using: {" "}
              <span style={{ color: "#B25AFF" }}>React</span>,
              <span style={{ color: "#B25AFF" }}> Three.js</span>,
              <span style={{ color: "#B25AFF" }}> JavaScript</span> plus 
              <span style={{ color: "#B25AFF" }}> C#/C++ </span>
               from my Games Tech degree.
            </p>
          </Panel>
        </motion.div>

        {/* Portrait (middle) — uses shared height */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ height: "var(--ph)" }}
        >
          <Panel title="/etc/portrait" pad={false}>
            <figure
              className="hud-figure h-full p-2"
              style={{ ["--sweep-s"]: "9s" }}
            >
              <div className="hud-stack">
                <img
                  src={headshot}
                  alt="Portrait"
                  className="hud-img "
                  draggable="false"
                  style={{ ["--obj-y"]: "0%" }}
                />
                <img
                  src={headshot}
                  className="ov hud-rgb r"
                  alt=""
                  aria-hidden
                />
                <img
                  src={headshot}
                  className="ov hud-rgb c"
                  alt=""
                  aria-hidden
                />
                {/* ▼ NEW: CRT overlay (same look as /bin/boot) */}
                <span className="ov hud-crt" aria-hidden="true" />

                {/* existing overlays */}
                <span className="ov hud-tint" aria-hidden="true" />
                <span className="ov hud-sweep" aria-hidden="true" />
                <span
                  className="ov hud-tint"
                  style={{ ["--tintA"]: 0.14, ["--tintO"]: 1 }}
                  aria-hidden="true"
                />
              </div>

              {/* corners */}
              <span className="hud-corner tl" aria-hidden="true" />
              <span className="hud-corner tr" aria-hidden="true" />
              <span className="hud-corner bl" aria-hidden="true" />
              <span className="hud-corner br" aria-hidden="true" />
            </figure>
          </Panel>
        </motion.div>

        {/* Right column — bound to same height; Focus auto, Learning fills rest */}
        <div
          className="hidden md:flex md:flex-col gap-6"
          style={{ height: "var(--ph)" }}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="shrink-0"
          >
            <Panel title="/proc/focus">
              <div className="flex flex-wrap gap-2">
                {focus.map((f) => (
                  <Chip key={f}>{f}</Chip>
                ))}
              </div>
            </Panel>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex-1 min-h-0"
          >
            <Panel title="/usr/learning">
              <div className="h-full overflow-auto">
                <ul className="font-mono text-[14px] leading-7 text-zinc-200/90 list-disc pl-5">
                  {learning.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </Panel>
          </motion.div>
        </div>

        {/* Mobile stack */}
        <motion.div
          className="md:hidden"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Panel title="/proc/focus">
            <div className="flex flex-wrap gap-2">
              {focus.map((f) => (
                <Chip key={f}>{f}</Chip>
              ))}
            </div>
          </Panel>
        </motion.div>
        <motion.div
          className="md:hidden"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Panel title="/usr/learning">
            <ul className="font-mono text-[14px] leading-7 text-zinc-200/90 list-disc pl-5">
              {learning.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Panel>
        </motion.div>
      </div>

      <motion.div
        className="mt-6"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <Panel title="/bin/toolbelt">
          <div className="flex flex-wrap gap-2">
            {technologies.map((t) => (
              <div
                key={t.name}
                className="flex items-center gap-2 px-2 py-1 border"
                style={{
                  borderColor: "rgba(178,90,255,0.30)",
                  backgroundColor: "rgba(178,90,255,0.06)",
                }}
              >
                {t.icon && (
                  <img src={t.icon} alt={t.name} className="w-4 h-4" />
                )}
                <span className="text-sm text-zinc-200/90">{t.name}</span>
              </div>
            ))}
          </div>
        </Panel>
      </motion.div>
    </>
  );
};

export default SectionWrapper(About, "about");
