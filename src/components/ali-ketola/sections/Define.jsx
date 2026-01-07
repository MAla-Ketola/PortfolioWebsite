import React from "react";
import { SectionHeader, Panel, Chip } from "../shared/ui";
import {
  interview,
  problems,
  goals,
  goalsParagraph,
  competitors,
  EDGE,
  SOFT,
} from "../content";
import { motion } from "framer-motion";

import {
  AKproblem1,
  AKproblem2,
  AKproblem3,
  AKproblem4,
  AKproblem5,
  AKproblem6,
} from "../../../assets";

const akProblemShots = [
  { src: AKproblem1, alt: "AK problem 01" },
  { src: AKproblem2, alt: "AK problem 02" },
  { src: AKproblem3, alt: "AK problem 03" },
  { src: AKproblem4, alt: "AK problem 04" },
  { src: AKproblem5, alt: "AK problem 05" },
  { src: AKproblem6, alt: "AK problem 06" },
];

const goalItems = goals.map((title, i) => ({
  title,
  desc: (goalsParagraph && goalsParagraph[i]) || "",
}));

// Toggle here: "emoji" | "mono"
const ICON_STYLE = "emoji";

const GOAL_KEYS = [
  "identity",
  "ia",
  "showcase",
  "multilingual",
  "cms",
  "booking",
];

const GOAL_ICONS = {
  mono: {
    identity: "◈", // visual identity
    ia: "⟷", // IA / navigation
    showcase: "▦", // cards/grid
    multilingual: "⇄", // languages
    cms: "✎", // editing
    booking: "✉︎", // contact/booking (text-style)
  },
  emoji: {
    identity: "🎨",
    ia: "🧭",
    showcase: "🖼️",
    multilingual: "🌐",
    cms: "🧰",
    booking: "☎️",
  },
};

export default function Define() {
  return (
    <section
      id="define"
      className="mt-8"
      style={{
        // Define = keep brand magenta
        "--accent": "#B25AFF",
        "--divide": "rgba(178,90,255,0.25)",
        "--soft": "rgba(178,90,255,0.06)",
      }}
    >
      <SectionHeader label="DEFINE" title="The Problem & Goals" />

      {/* Main subsection title */}
      <h3 className="text-2xl md:text-3xl font-semibold text-white mt-12">
        The problem
      </h3>

      <p className="mt-4 max-w-3xl text-white/90 font-mono text-[15px] leading-7">
        The previous Ali-Ketolan Tila website suffered from an outdated design
        and an unwieldy layout that undercut the farm’s potential to engage
        visitors:
      </p>

      {/* Problem Cards */}
      <motion.div
        className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.25 }}
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
        }}
      >
        {problems.map((text, i) => (
          <motion.div
            key={i}
            variants={{
              hidden: { opacity: 0, y: 10 },
              show: { opacity: 1, y: 0 },
            }}
            style={{
              "--accent": "#FF2BD1",
              "--divide": "rgba(255, 43, 209, 0.28)",
              "--soft": "rgba(255, 43, 209, 0.09)",
            }}
          >
            <Panel
              title={`/usr/problem-${String(i + 1).padStart(2, "0")}`}
              className="h-full"
            >
              <div className="px-2 py-2 md:px-3 md:py-3 min-h-[140px] flex items-center justify-center">
                <p className="text-center font-mono text-[14.5px] md:text-[15px] leading-7 text-white/90">
                  {text}
                </p>
              </div>
            </Panel>
          </motion.div>
        ))}
      </motion.div>

      <p className="mt-12 max-w-3xl text-white/90 font-mono text-[15px] leading-7 text-center mx-auto">
        Let’s zoom in on the details:
      </p>

      {/* Desktop grid fallback */}
      <div className="hidden md:grid mt-12 grid-cols-2 gap-4">
        {akProblemShots.map((img, i) => (
          <motion.figure
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-7"
            key={`ak-${i}`}
          >
            <div className="relative w-full overflow-hidden rounded-2xl min-h-[300px] lg:min-h-0 lg:h-full">
              <img
                src={img.src}
                alt={img.alt}
                className="h-full w-full object-cover select-none"
                loading="lazy"
              />
            </div>
          </motion.figure>
        ))}
      </div>

      {/* --- Goals */}
      <h3 className="text-2xl md:text-3xl font-semibold text-white mt-24">
        Goals
      </h3>

      <p className="mt-4 max-w-3xl text-white/90 font-mono text-[15px] leading-7">
        To address these issues, we set out six key{" "}
        <span className="relative inline-block">
          <span className="text-white">goals</span>
          <span
            aria-hidden
            className="absolute left-0 right-0 -bottom-0.5 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent"
          />
          <span
            aria-hidden
            className="absolute left-0 right-0 -bottom-1 h-[6px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-45 blur-[3px]"
          />
        </span>
        :
      </p>

      {/* Scoped mint accent just for Goals */}
      <div
        className="mt-6"
        style={{
          // mint accent for Goals (distinct from Problems' neon pink)
          "--accent": "#74FFCD",
          "--divide": "rgba(116,255,205,0.26)",
          "--soft": "rgba(116,255,205,0.08)",
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
          {goalItems.map((item, i) => {
            const key = GOAL_KEYS[i] ?? "identity";
            return (
              <motion.div
                key={`goal-${i}-${key}`}
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 220, damping: 18 }}
                className="h-full"
              >
                <Panel
                  title={`/usr/goal-${String(i + 1).padStart(2, "0")}`}
                  className="h-full"
                >
                  <div className="p-4 md:p-5 flex flex-col h-full group">
                    {/* Title block */}
                    <div
                      className="grid place-items-center text-center gap-2 px-4 border-b
             h-[160px] md:h-[176px]"
                      style={{
                        borderColor: "var(--divide)",
                        borderBottomWidth: "2px",
                      }}
                    >
                      {/* soft radial glow behind icon */}
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0"
                      />
                      {/* Icon */}
                      <span
                        aria-hidden
                        className={
                          ICON_STYLE === "emoji"
                            ? "relative z-10 text-3xl md:text-4xl leading-none translate-y-[1px]"
                            : "relative z-10 text-2xl md:text-3xl leading-none"
                        }
                      >
                        {GOAL_ICONS[ICON_STYLE][key]}
                      </span>

                      {/* Title */}
                      <h4 className="font-mono text-[15px] md:text-[16px] font-semibold text-white leading-tight
             max-w-[22ch] [text-wrap:balance]">
                        {item.title}
                      </h4>

                      {/* hairline under title */}
                      <div
                        className="absolute left-4 right-4 -bottom-px h-px"
                        style={{
                          background:
                            "linear-gradient(90deg, transparent, var(--divide), transparent)",
                        }}
                      />
                    </div>

                    {/* Body */}
                    <p className="mt-4 font-mono text-[14px] leading-6 text-white/90 flex-1">
                      {item.desc}
                    </p>
                  </div>
                </Panel>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        <Panel title="/usr/goals">
          <div className="flex flex-wrap gap-2">
            {goals.map((g, i) => (
              <Chip key={i}>{g}</Chip>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-4">
        <Panel title="/opt/competitive-landscape">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {competitors.map((c, i) => (
              <div
                key={i}
                className="border p-4"
                style={{ borderColor: EDGE, backgroundColor: SOFT }}
              >
                <div className="font-mono text-white/95">{c.name}</div>
                <p className="mt-2 font-mono text-[13px] text-white/80 leading-6">
                  {c.notes}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </section>
  );
}
