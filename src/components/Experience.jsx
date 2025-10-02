// Experience.jsx — magenta HUD (matches About/Works)
import React from "react";
import {
  VerticalTimeline,
  VerticalTimelineElement,
} from "react-vertical-timeline-component";
import { motion } from "framer-motion";
import "react-vertical-timeline-component/style.min.css";

import { styles } from "../styles";
import { experiences } from "../constants";
import { SectionWrapper } from "../hoc";

/* =======================
   Title FX (same as About)
   ======================= */
const GLYPHS = "01<>{}/\\|=+*#@$%&?";

function SectionTitleStyles() {
  return (
    <style>{`
/* H2 — near-white → magenta glow, subtle scanlines */
.hud-h2{
  --hud-r:232; --hud-g:240; --hud-b:255; /* near-white base */
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

/* Magenta typed label (same as About) */
.hud-label{
  --hud-r:178; --hud-g:90; --hud-b:255; /* #B25AFF */
  display:inline-block; line-height:1;
  -webkit-text-stroke:.65px rgba(var(--hud-r),var(--hud-g),var(--hud-b),.65);
  background:
    linear-gradient(180deg,
      rgba(var(--hud-r),var(--hud-g),var(--hud-b),1),
      rgba(var(--hud-r),var(--hud-g),var(--hud-b),.88)),
    repeating-linear-gradient(0deg, rgba(255,255,255,.08) 0 1px, transparent 1px 3px);
  -webkit-background-clip:text; background-clip:text; color:transparent;
  text-shadow:
    0 0 10px rgba(var(--hud-r),var(--hud-g),var(--hud-b),.25),
    0 0 2px  rgba(var(--hud-r),var(--hud-g),var(--hud-b),.85);
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
    linear-gradient(180deg, rgba(178,90,255,1), rgba(178,90,255,.88)),
    repeating-linear-gradient(0deg, rgba(255,255,255,.08) 0 1px, transparent 1px 3px);
  box-shadow: 0 0 .5px rgba(178,90,255,.95), 0 0 8px rgba(178,90,255,.35);
  animation: blink 1s step-end infinite; opacity:0;
}
.type-title[data-animate="true"] .type-inner::after{ opacity:1; }

@keyframes typingMask{
  from { -webkit-mask-size:0% 100%; mask-size:0% 100%; }
  to   { -webkit-mask-size:101% 100%; mask-size:101% 100%; }
}
@keyframes blink { 50% { opacity:0 } }

@media (prefers-reduced-motion: reduce){
  .type-title[data-animate="true"] .type-inner{ animation:none!important; -webkit-mask:none; mask:none; }
  .type-inner::after{ animation:none!important; opacity:1; }
}
    `}</style>
  );
}

function ScrambleText({ text, duration = 450, delay = 0 }) {
  const spanRef = React.useRef(null);
  const [out, setOut] = React.useState(() =>
    text.split("").map(() => GLYPHS[(Math.random() * GLYPHS.length) | 0]).join("")
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
        i < reveal ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0]
      ).join("");
      setOut(next);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    const id = setTimeout(() => (raf.current = requestAnimationFrame(tick)), delay);
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
    return () => { io.disconnect(); if (raf.current) cancelAnimationFrame(raf.current); };
  }, [play]);

  return <span ref={spanRef} aria-label={text}>{out}</span>;
}

function TypeTitle({ text, duration = 700, delay = 0, className = "" }) {
  const chars = [...text].length;
  const [animate, setAnimate] = React.useState(false);
  const hostRef = React.useRef(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const el = hostRef.current; if (!el) return;

    const play = () => {
      if (reduce) { setAnimate(false); return; }
      setAnimate(false); void el.offsetWidth; setTimeout(() => setAnimate(true), delay);
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

/* =======================
   Timeline cards (magenta, square corners)
   ======================= */

const EDGE = "rgba(178,90,255,0.30)";
const DIVIDE = "rgba(178,90,255,0.25)";
const GLOW  = "0 0 40px rgba(178,90,255,.08)";
const NEAR  = "rgba(232,240,255,0.92)";

const ExperienceCard = ({ item }) => {
  const showTimelineDate = false;

  return (
    <VerticalTimelineElement
      contentStyle={{
        background: "rgba(0,0,0,0.55)",
        border: `1px solid ${EDGE}`,
        boxShadow: GLOW,
        padding: 0,
        borderRadius: 0,              // square corners
      }}
      contentArrowStyle={{ borderRight: `7px solid ${EDGE}` }}
      date={showTimelineDate ? item.date : undefined}
      iconStyle={{
        background: "#000",
        boxShadow: `0 0 0 2px rgba(178,90,255,0.55), 0 0 18px rgba(178,90,255,0.35)`,
      }}
      icon={
        <div className="flex items-center justify-center w-full h-full">
          {item.icon ? (
            <img
              src={item.icon}
              alt={item.company_name || item.title}
              className="w-[60%] h-[60%] object-contain"
            />
          ) : (
            <div className="w-2 h-2 rounded-full bg-[#B25AFF] shadow-[0_0_12px_rgba(178,90,255,0.8)]" />
          )}
        </div>
      }
    >
      {/* Panel header strip (matches About panel) */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b text-xs"
        style={{ borderBottomColor: DIVIDE, color: "rgba(178,90,255,0.90)" }}
      >
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: "rgba(178,90,255,0.85)", boxShadow: "0 0 10px rgba(178,90,255,0.6)" }}
        />
        <span className="uppercase tracking-widest font-mono">
          /var/education
        </span>
        {item.date && (
          <span className="ml-auto font-mono uppercase text-[10px] text-[rgba(178,90,255,0.65)]">
            {item.date}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4 md:p-5">
        <h3 className="font-mono text-[rgba(232,240,255,0.98)] text-[18px] md:text-[20px] font-semibold">
          {item.title || "Experience"}
        </h3>
        {(item.company_name || item.provider) && (
          <p className="font-mono text-[13px] text-[rgba(232,240,255,0.82)]">
            {item.company_name || item.provider}
          </p>
        )}

        {Array.isArray(item.points) && item.points.length > 0 && (
          <ul className="mt-4 list-disc pl-5 space-y-1">
            {item.points.map((point, i) => (
              <li
                key={`exp-point-${i}`}
                className="font-mono text-[13px] leading-6 text-[rgba(232,240,255,0.92)]"
              >
                {point}
              </li>
            ))}
          </ul>
        )}
      </div>
    </VerticalTimelineElement>
  );
};

const Experience = () => {
  return (
    <>
      <SectionTitleStyles />

      {/* Centered title block */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <p className={`${styles.sectionSubText} text-center`}>
          <TypeTitle text="What I have learned so far" duration={650} delay={50} />
        </p>

        <h2 className={`${styles.sectionHeadText} text-center`}>
          <span className="hud-h2">
            <ScrambleText text="Education" duration={450} />
          </span>
        </h2>
      </motion.div>

      <div className="mt-16 flex flex-col">
        <VerticalTimeline lineColor="rgba(178,90,255,0.30)">
          {experiences.map((item, index) => (
            <ExperienceCard key={`experience-${index}`} item={item} />
          ))}
        </VerticalTimeline>
      </div>
    </>
  );
};

export default SectionWrapper(Experience, "experience");

