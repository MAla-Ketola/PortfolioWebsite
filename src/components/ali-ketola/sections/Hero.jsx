import { motion } from "framer-motion";
import { SectionHeader, Panel, Stat, CTAButton } from "../shared/ui";
import { meta, validateStats, EDGE } from "../content";
import React from "react";

import { AK } from "../../../assets";

export default function Hero() {
  // --- helpers for nicer chips ---
  const roleParts = Array.isArray(meta.role)
    ? meta.role
    : `${meta.role}`.split(/[;•·|]/).map(s => s.trim()).filter(Boolean);

  const tools = Array.isArray(meta.tools)
    ? meta.tools
    : `${meta.tools}`.split(/[;,]/).map(s => s.trim()).filter(Boolean);

  // Optional microcopy tweak: turn "+ branding" into "& brand refresh"
  const projectText =
    (meta.project && meta.project.replace(/\+\s*branding/i, "& brand refresh")) ||
    meta.project ||
    "End-to-end responsive website & brand refresh";

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <div className="max-w-5xl mx-auto text-center px-4">
          <SectionHeader label="CASE STUDY" title="Ali-Ketola’s Farm" />
          {/* removed duplicate max-w-3xl so 65ch wins */}
          <p className="mx-auto mt-2 max-w-[65ch] font-mono text-[15px] leading-7 text-white/85">
            Redesigning Ali-Ketola’s Farm from a fragmented experience to a
            warm, organised, and mobile-first site that reflects the real place
            and helps visitors get in touch quickly.
          </p>
        </div>
      </motion.div>

      {/* Image (left) + Meta & Impact (right) */}
      <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:items-stretch">
        {/* Left: Image */}
        <motion.figure
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="lg:col-span-7"
        >
          <div className="relative w-full overflow-hidden rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.45)]
+                 min-h-[300px] lg:min-h-0 lg:h-full">
            <img
              src={AK}
              alt="Ali-Ketola’s Farm website preview on a laptop screen"
              className="h-full w-full object-cover select-none"
              loading="lazy"
            />
          </div>
        </motion.figure>

        {/* Right: Panels stacked */}
        <div className="lg:col-span-5 md:top-24 space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Panel title="/etc/project-meta">
              {/* ⬇️ Tidy, scannable definition list with chips */}
              <dl className="divide-y divide-white/10 font-mono text-[14px] text-white/90">
                <div className="grid grid-cols-[7.5rem_1fr] items-baseline gap-x-6 py-3">
                  <dt className="text-xs tracking-wide uppercase text-white/55">Project</dt>
                  <dd>{projectText}</dd>
                </div>

                <div className="grid grid-cols-[7.5rem_1fr] items-baseline gap-x-6 py-3">
                  <dt className="text-xs tracking-wide uppercase text-white/55">Role</dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {roleParts.map((t) => (
                      <span key={t} className="rounded-md border border-white/12 px-2 py-0.5 text-sm">
                        {t}
                      </span>
                    ))}
                  </dd>
                </div>

                <div className="grid grid-cols-[7.5rem_1fr] items-baseline gap-x-6 py-3">
                  <dt className="text-xs tracking-wide uppercase text-white/55">Industry</dt>
                  <dd>{meta.industry}</dd>
                </div>

                <div className="grid grid-cols-[7.5rem_1fr] items-baseline gap-x-6 py-3">
                  <dt className="text-xs tracking-wide uppercase text-white/55">Tools</dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {tools.map((t) => (
                      <span key={t} className="rounded-md border border-white/12 px-2 py-0.5 text-sm">
                        {t}
                      </span>
                    ))}
                  </dd>
                </div>
              </dl>
            </Panel>
          </motion.div>

          {/* Impact panel (keep commented until ready)
          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Panel title="/var/impact">
              <div className="space-y-3">
                {validateStats.map((s, i) => (<Stat key={i} {...s} />))}
              </div>
            </Panel>
          </motion.div>
          */}

          <div className="mt-5">
            <CTAButton
              href="https://…"
              target="_self"
              label="View Ali-Ketola live website"
              className="w-full justify-center"
            >
              View Live Website
            </CTAButton>
          </div>
        </div>
      </div>
    </>
  );
}

