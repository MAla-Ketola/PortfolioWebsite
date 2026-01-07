import React from "react";
import { motion } from "framer-motion";
import { fadeIn } from "../../../utils/motion"; // same util used in Works.jsx
import { Panel, SectionHeader } from "../shared/ui";

export default function Nav() {
  const steps = [
    { id: "define", label: "DEFINE" },
    { id: "ideate", label: "IDEATE" },
    { id: "prototype", label: "PROTOTYPE" },
    { id: "implement", label: "IMPLEMENT" },
    { id: "validate", label: "VALIDATE" },
  ];

  const USE_ICONS = true; // toggle on/off
  const ICON_STYLE = "emoji"; // "mono" | "emoji"

  const ICONS = {
    mono: { define: "⌘", ideate: "✦", prototype: "⧉", implement: "⌁", validate: "✓" },
    emoji: { define: "🧭", ideate: "💡", prototype: "🧪", implement: "🛠️", validate: "✅" },
  };

  // Grid-level stagger for that smooth cascade
  const container = {
    hidden: { opacity: 1 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.05 },
    },
  };

  return (
    <section id="nav" className="mt-8">
      {/* Header anim (matches Works pattern) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <SectionHeader label="Steps" title="The Process" />
      </motion.div>

      {/* Staggered grid reveal */}
      <motion.div
        className="mt-6 grid grid-cols-2 min-[560px]:grid-cols-5 gap-2"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
      >
        {steps.map((s, i) => (
          <motion.a
            key={s.id}
            href={`#${s.id}`}
            className="group block"
            variants={fadeIn("up", "spring", i * 0.08, 0.55)}
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 160, damping: 18 }}
          >
            <Panel
              title={`/${s.label.toLowerCase()}`}
              className="transition-all duration-200 border-[#B25AFF]/40 group-hover:border-[#B25AFF]/80 group-hover:shadow-[0_0_0_1px_#B25AFF,0_0_26px_-6px_#B25AFF]"
            >
              <div className="h-36 md:h-40 py-3 flex flex-col items-center justify-center text-center">
                {/* Top icon/emoji */}
                <motion.span
                  aria-hidden
                  className="text-3xl md:text-4xl leading-none drop-shadow-[0_0_10px_rgba(178,90,255,.35)]"
                  whileHover={{ scale: 1.06 }}
                  transition={{ type: "spring", stiffness: 220, damping: 16 }}
                >
                  {USE_ICONS && ICONS[ICON_STYLE][s.id]}
                </motion.span>

                {/* Label under it */}
                <span className="mt-2 font-mono text-[15px] tracking-[0.08em] text-white/90">
                  {s.label}
                </span>
              </div>
            </Panel>
          </motion.a>
        ))}
      </motion.div>
    </section>
  );
}
