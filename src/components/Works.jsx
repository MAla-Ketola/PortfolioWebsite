import React from "react";
import { motion } from "framer-motion";

import { styles } from "../styles";
import { github } from "../assets";
import { SectionWrapper } from "../hoc";
import { projects } from "../constants";
import { fadeIn } from "../utils/motion";

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
     
      .hud-ring{ z-index:30; box-shadow: inset 0 0 0 1px rgba(178,90,255,.32), 0 0 0 1px rgba(178,90,255,.22), 0 0 36px rgba(178,90,255,.12); transition: box-shadow .2s ease; }
      .group:hover .hud-ring{ box-shadow: inset 0 0 0 1px rgba(178,90,255,.45), 0 0 0 1px rgba(178,90,255,.28), 0 0 46px rgba(178,90,255,.16); }
 

      /* Reinforce bottom edge on small screens (hairline can vanish) */
      .panel{ position: relative; }
      .panel::after{
        content:"";
        position:absolute;
        inset:0;
        pointer-events:none;
        border-radius:inherit;
        box-shadow: inset 0 -1px rgba(178,90,255,.55);
      }
      @media (max-width: 639px){
        .panel{ border-color: rgba(178,90,255,.42) !important; }
      }

      @media (max-width: 640px){
  .hud-ring{ box-shadow: inset 0 0 0 1px rgba(178,90,255,.28); }
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

const EDGE = "rgba(178,90,255,0.30)"; // panel edge / chips edge
const DIVIDE = "rgba(178,90,255,0.25)"; // panel header divider
const SOFT = "rgba(178,90,255,0.06)"; // soft plate fill
const NEARWHITE = "rgba(232,240,255,0.92)";

const slugify = (s = "") =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const Panel = ({ title, right, children, className = "" }) => (
  <div
    className={[
      "bg-black/50 md:backdrop-blur-sm overflow-hidden flex flex-col", // was always blurred
      "shadow-[0_0_40px_rgba(178,90,255,0.08)]",
      "border",
      "rounded-none",
      "panel",
      className,
    ].join(" ")}
    style={{
      borderColor: EDGE,
      minHeight: "var(--card-h, auto)",
      contentVisibility: "auto",
      containIntrinsicSize: "600px 480px",
    }}
  >
    <div
      className="flex items-center gap-2 px-3 md:px-3 py-2 border-b text-xs"
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
    <div className="px-3 md:px-3 py-3 md:py-3 flex-1 flex flex-col">{children}</div>
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

// ===============================
// NEW: Button styled to match the Contact.jsx "Send" button exactly
// ===============================
const ContactStyleButton = ({
  href,
  onClick,
  children,
  label,
  target = "_blank",
  className = "",
}) => {
  const Comp = href ? "a" : "button";

  const style = {
    border: `1px solid ${EDGE}`,
    backgroundColor: "rgba(178,90,255,0.10)",
    color: "rgba(232,240,255,0.95)",
    boxShadow: "0 0 20px rgba(178,90,255,.15)",
  };

  const onEnter = (e) =>
    (e.currentTarget.style.backgroundColor = "rgba(178,90,255,0.18)");
  const onLeave = (e) =>
    (e.currentTarget.style.backgroundColor = "rgba(178,90,255,0.10)");

  return (
    <Comp
      href={href}
      onClick={onClick}
      aria-label={label}
      target={target}
      rel={target === "_blank" ? "noopener noreferrer" : undefined}
      style={style}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className={`inline-flex items-center gap-2 rounded-none px-5 py-2.5 font-mono font-bold focus:outline-none focus:ring-2 ${className}`}
    >
      {children}
    </Comp>
  );
};

// Stronger, neon-y primary/ghost buttons used for Repo/Demo
const IconButton = ({
  href,
  onClick,
  children,
  label,
  target = "_blank",
  className = "",
}) => {
  const Comp = href ? "a" : "button";

  const style = {
    border: `1px solid ${EDGE}`,
    backgroundColor: "rgba(178,90,255,0.10)",
    color: "rgba(232,240,255,0.95)",
    boxShadow: "0 0 20px rgba(178,90,255,.15)",
  };

  const onEnter = (e) =>
    (e.currentTarget.style.backgroundColor = "rgba(178,90,255,0.18)");
  const onLeave = (e) =>
    (e.currentTarget.style.backgroundColor = "rgba(178,90,255,0.10)");

  return (
    <Comp
      href={href}
      onClick={onClick}
      aria-label={label}
      target={target}
      rel={target === "_blank" ? "noopener noreferrer" : undefined}
      style={style}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className={`inline-flex items-center gap-2 rounded-none px-5 py-2.5 font-mono font-bold focus:outline-none focus:ring-2 ${className}`}
    >
      {children}
    </Comp>
  );
};

const SmartImg = ({ src, alt, priority = false, className = "" }) => {
  const [loaded, setLoaded] = React.useState(false);
  return (
    <div
      className={`card-img group relative w-full aspect-[16/9] overflow-hidden shrink-0 rounded-none ${
        loaded ? "loaded" : ""
      }`}
      style={{ border: `1px solid ${EDGE}`, isolation: "isolate" }}
    >
      <img
        src={src}
        alt={alt}
        width={1280}
        height={720}
        sizes="(min-width:1440px) 31vw, (min-width:850px) 48vw, 100vw"
        loading={priority ? "eager" : "lazy"}
        fetchpriority={priority ? "high" : "auto"}
        decoding="async"
        className={`card-img w-full h-full object-cover relative z-0 ${className}`}
        draggable="false"
        onLoad={() => setLoaded(true)}
      />
      <span className="ov hud-tint-project" aria-hidden="true" />
      <span className="ov" aria-hidden="true" />
      <span className="ov hud-ring" aria-hidden="true" />
    </div>
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
  page,
}) => {
  const slug = slugify(name);
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      variants={fadeIn("up", "spring", index * 0.12, 0.6)}
      className="h-full"
    >
      <Panel
        className="h-full project-card"
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
              <IconButton href={live_demo} label={`Open live demo for ${name}`}>
                ⏵ Live
              </IconButton>
            )}
          </div>
        }
      >
        {image && <SmartImg src={image} alt={name} priority={index < 2} />}

        <div className="mt-5">
          <h3 className="font-mono text-[rgba(232,240,255,0.98)] text-[18px] md:text-[20px] font-semibold">
            {name}
          </h3>
          {description && (
            <p className="mt-2 font-mono text-[14px] leading-7 text-[rgba(232,240,255,0.88)]">
              {description}
            </p>
          )}

          {page && (
            <div className="mt-5">
              <ContactStyleButton
                href={page}
                target="_self"
                label={`View ${name} page`}
                className="w-full justify-center"
              >
                View
              </ContactStyleButton>
            </div>
          )}
        </div>

        {!!tags.length && (
          <div className="mt-auto pt-5 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Tag key={`${name}-${tag.name}`}>{tag.name}</Tag>
            ))}
          </div>
        )}
      </Panel>
    </motion.div>
  );
};

function useEqualCardHeights(rootRef, deps = []) {
  React.useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const measure = () => {
      const cards = root.querySelectorAll(".project-card");
      let max = 0;
      cards.forEach((el) => {
        const h = el.scrollHeight;
        if (h > max) max = h;
      });
      if (max > 0) root.style.setProperty("--card-h", `${Math.ceil(max)}px`);
    };

    measure();
    const onResize = () => measure();
    window.addEventListener("resize", onResize);

    if (document.fonts?.ready) {
      document.fonts.ready.then(() => measure()).catch(() => {});
    }

    const t = setTimeout(measure, 50);

    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", onResize);
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

const Works = () => {
  const gridRef = React.useRef(null);
  useEqualCardHeights(gridRef, [projects?.length || 0]);

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
          <TypeTitle text="MY WORK" duration={650} delay={50} />
        </p>
        <h2 className={`${styles.sectionHeadText}`}>
          <span className="hud-h2">
            <ScrambleText text="Projects" duration={450} />
          </span>
        </h2>
      </motion.div>

      <div className="w-full flex">
        <motion.p
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeIn("", "", 0.1, 1)}
          className="mt-3 font-mono text-[rgba(232,240,255,0.88)] text-[15px] max-w-3xl leading-7"
        >
          Projects and experiments at the intersection of user experience,
          interface design, and software development—exploring structure,
          performance, and accessibility.
        </motion.p>
      </div>

      <div ref={gridRef} className="mt-8 works-grid">
        <div className="grid grid-cols-1 min-[850px]:grid-cols-2 min-[1440px]:grid-cols-3 gap-4 sm:gap-6 items-stretch">
          {projects.map((project, i) => (
            <ProjectCard key={`project-${i}`} index={i} {...project} />
          ))}
        </div>
      </div>
    </>
  );
};

export default SectionWrapper(Works, "work");


