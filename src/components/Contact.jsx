// Contact.jsx — magenta HUD, square corners, About-style borders
import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import emailjs from "@emailjs/browser";

import { styles } from "../styles";
import { SectionWrapper } from "../hoc";
import { slideIn } from "../utils/motion";

/* =======================
   Title FX (same as About)
   ======================= */
const GLYPHS = "01<>{}/\\|=+*#@$%&?";

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

/* Magenta typed label */
.hud-label{
  --hud-r:178; --hud-g:90; --hud-b:255;
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
    linear-gradient(180deg,
      rgba(178,90,255,1), rgba(178,90,255,.88)),
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
  const [out, setOut] = useState(() =>
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
  const [animate, setAnimate] = useState(false);
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
      void el.offsetWidth; // restart CSS anim
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

/* =======================
   Magenta panel + form controls
   ======================= */
const EDGE = "rgba(178,90,255,0.30)"; // panel edge / inputs / chips
const DIVIDE = "rgba(178,90,255,0.25)"; // header divider
const PLATE = "rgba(178,90,255,0.06)"; // subtle plate fill
const NEAR = "rgba(232,240,255,0.92)";

const Panel = ({ title, right, children, className = "" }) => (
  <div
    className={[
      "relative bg-black/50 backdrop-blur-sm overflow-hidden flex flex-col",
      "rounded-none border shadow-[0_0_40px_rgba(178,90,255,.08)]",
      className,
    ].join(" ")}
    style={{ borderColor: EDGE }}
  >
    <div
      className="flex items-center gap-2 px-3 py-2 border-b text-[11px] font-mono uppercase tracking-widest"
      style={{ borderBottomColor: DIVIDE, color: "rgba(178,90,255,0.90)" }}
    >
      <span
        className="w-2 h-2 rounded-full"
        style={{
          backgroundColor: "rgba(178,90,255,0.85)",
          boxShadow: "0 0 10px rgba(178,90,255,0.6)",
        }}
      />
      <span>{title}</span>
      <div className="ml-auto">{right}</div>
    </div>
    <div className="p-4 md:p-5 flex-1 flex flex-col">{children}</div>
  </div>
);

const Contact = () => {
  const formRef = useRef(null);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [botTrap, setBotTrap] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (botTrap) return;
    setLoading(true);
    setStatus("");

    emailjs
      .send(
        "service_i2ymbsd",
        "template_2mvtbla",
        {
          from_name: form.name,
          to_name: "Marjut",
          from_email: form.email,
          to_email: "alaketolamarjut@gmail.com",
          message: form.message,
        },
        "FkqkSeY1cAdzcAY6h"
      )
      .then(() => {
        setLoading(false);
        setStatus("Thanks! Your message is on its way.");
        setForm({ name: "", email: "", message: "" });
      })
      .catch(() => {
        setLoading(false);
        setStatus("Oops—something went wrong. Try again?");
      });
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText("alaketolamarjut@gmail.com");
      setStatus("Email copied to clipboard.");
    } catch {
      setStatus("Couldn’t copy—tap the mail link instead.");
    }
  };

  const inputBase =
    "bg-black/60 rounded-none px-4 py-3 outline-none font-mono " +
    "focus:ring-2 focus:ring-[rgba(178,90,255,0.45)] " +
    "focus:border-[rgba(178,90,255,0.70)]";

  return (
    <>
      {/* Inject shared HUD styles */}
      <SectionTitleStyles />

      {/* Equal-height columns grid */}
      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch overflow-x-clip">
        {/* Left: contact form */}
        <motion.div
          variants={slideIn("left", "tween", 0.2, 1)}
          className="h-full"
        >
          <Panel title="/dev/contact" className="h-full min-h-[520px]">
            {/* About-style title inside the panel */}
            <p className={`${styles.sectionSubText}`}>
              <TypeTitle text="GET IN TOUCH" duration={650} delay={50} />
            </p>
            <h3 className={`${styles.sectionHeadText}`}>
              <span className="hud-h2">
                <ScrambleText text="Contact" duration={450} />
              </span>
            </h3>

            <form
              ref={formRef}
              onSubmit={handleSubmit}
              className="mt-6 flex flex-col gap-5"
              aria-live="polite"
            >
              {/* Honeypot field (hidden) */}
              <input
                type="text"
                name="company"
                value={botTrap}
                onChange={(e) => setBotTrap(e.target.value)}
                className="hidden"
                tabIndex="-1"
                autoComplete="off"
              />

              <label className="flex flex-col">
                <span className="font-mono text-[rgba(232,240,255,0.9)] mb-2">
                  Your Name
                </span>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Name"
                  className={`${inputBase} border`}
                  style={{
                    borderColor: EDGE,
                    color: "rgba(232,240,255,0.95)",
                    caretColor: "rgba(178,90,255,1)",
                  }}
                  required
                />
              </label>

              <label className="flex flex-col">
                <span className="font-mono text-[rgba(232,240,255,0.9)] mb-2">
                  Your Email
                </span>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={`${inputBase} border`}
                  style={{
                    borderColor: EDGE,
                    color: "rgba(232,240,255,0.95)",
                    caretColor: "rgba(178,90,255,1)",
                  }}
                  required
                />
              </label>

              <label className="flex flex-col">
                <span className="font-mono text-[rgba(232,240,255,0.9)] mb-2">
                  Message
                </span>
                <textarea
                  id="message"
                  rows={7}
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Tell me about your idea or role…"
                  className={`${inputBase} border`}
                  style={{
                    borderColor: EDGE,
                    color: "rgba(232,240,255,0.95)",
                    caretColor: "rgba(178,90,255,1)",
                  }}
                  required
                />
              </label>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-none px-5 py-2.5 font-mono font-bold focus:outline-none focus:ring-2"
                  style={{
                    border: `1px solid ${EDGE}`,
                    backgroundColor: "rgba(178,90,255,0.10)",
                    color: "rgba(232,240,255,0.95)",
                    boxShadow: "0 0 20px rgba(178,90,255,.15)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      "rgba(178,90,255,0.18)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      "rgba(178,90,255,0.10)")
                  }
                >
                  {loading ? "Sending…" : "Send"}
                </button>
                {status && (
                  <span
                    className="font-mono"
                    style={{ color: "rgba(232,240,255,0.85)" }}
                  >
                    {status}
                  </span>
                )}
              </div>
            </form>
          </Panel>
        </motion.div>

        {/* Right: routes / quick links */}
        <motion.div
          variants={slideIn("right", "tween", 0.2, 1)}
          className="h-full"
        >
          <Panel
            title="/etc/routes"
            className="h-full min-h-[520px]"
            right={
              <button
                onClick={copyEmail}
                className="text-[11px] font-mono px-2 py-1 rounded-none focus:outline-none focus:ring-2"
                style={{
                  border: `1px solid ${EDGE}`,
                  backgroundColor: "rgba(178,90,255,0.10)",
                  color: "rgba(232,240,255,0.95)",
                }}
                aria-label="Copy email to clipboard"
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "rgba(178,90,255,0.18)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "rgba(178,90,255,0.10)")
                }
              >
                copy email
              </button>
            }
          >
            <div
              className="font-mono text-[14px] space-y-4"
              style={{ color: NEAR }}
            >
              <div>
                <p
                  className="uppercase tracking-widest text-[11px] mb-1"
                  style={{ color: "rgba(178,90,255,0.75)" }}
                >
                  Primary
                </p>
                <a
                  href="mailto:alaketolamarjut@gmail.com"
                  className="underline"
                  style={{ textDecorationColor: "rgba(178,90,255,0.40)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.textDecorationColor =
                      "rgba(178,90,255,1)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.textDecorationColor =
                      "rgba(178,90,255,0.40)")
                  }
                >
                  alaketolamarjut@gmail.com
                </a>
              </div>

              <div>
                <p
                  className="uppercase tracking-widest text-[11px] mb-1"
                  style={{ color: "rgba(178,90,255,0.75)" }}
                >
                  Profiles
                </p>
                <ul className="space-y-1">
                  <li>
                    <a
                      href="https://github.com/YOUR_USERNAME"
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                      style={{ textDecorationColor: "rgba(178,90,255,0.40)" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.textDecorationColor =
                          "rgba(178,90,255,1)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.textDecorationColor =
                          "rgba(178,90,255,0.40)")
                      }
                    >
                      github.com/YOUR_USERNAME
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://linkedin.com/in/YOUR_USERNAME"
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                      style={{ textDecorationColor: "rgba(178,90,255,0.40)" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.textDecorationColor =
                          "rgba(178,90,255,1)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.textDecorationColor =
                          "rgba(178,90,255,0.40)")
                      }
                    >
                      linkedin.com/in/YOUR_USERNAME
                    </a>
                  </li>
                </ul>
              </div>

              {/* console readout */}
              <div
                className="mt-6 p-3 rounded-none border"
                style={{
                  borderColor: DIVIDE,
                  backgroundColor: "rgba(0,0,0,0.4)",
                }}
              >
                <pre
                  className="whitespace-pre-wrap leading-7"
                  style={{ color: NEAR }}
                >
                  {`marjut@portfolio:~$ ping contact
> listening on ports: email, github, linkedin
> status: online`}
                  <span className="animate-pulse"> ▍</span>
                </pre>
              </div>
            </div>

            {/* Scoped scanline overlay (magenta) */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-10 mix-blend-soft-light"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(to bottom, rgba(178,90,255,0.25) 0, rgba(178,90,255,0.25) 1px, transparent 1px, transparent 3px)",
              }}
            />
          </Panel>
        </motion.div>
      </div>
    </>
  );
};

export default SectionWrapper(Contact, "contact");
