// src/components/case-studies/ali-ketola/sections/IdeateSection.jsx
import React from "react";
import { SectionHeader, Panel } from "../shared/ui";
import { palette, typography, patterns, EDGE, SOFT } from "../content";

export default function Ideate() {
  return (
    <section id="ideate" className="mt-12">
      <SectionHeader label="IDEATE" title="Moodboard & Structure" />

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="/brand/palette">
          <div className="flex flex-wrap gap-3 items-center">
            {palette.map((hex) => (
              <div key={hex} className="flex items-center gap-2">
                <span className="w-8 h-8 border" style={{ backgroundColor: hex, borderColor: EDGE }} />
                <code className="text-sm text-white/80">{hex}</code>
              </div>
            ))}
          </div>
          <div className="mt-3 font-mono text-[13px] text-white/75">
            Rustic, down-to-earth tones balanced for clarity.
          </div>
        </Panel>

        <Panel title="/brand/type">
          <ul className="font-mono text-[14px] leading-7 text-white/90 list-disc pl-5">
            {typography.map((t) => <li key={t}>{t}</li>)}
          </ul>
          <div className="mt-2 font-mono text-[13px] text-white/75">
            Balanced headers & approachable body copy.
          </div>
        </Panel>

        <Panel title="/ia/sitemap">
          <ul className="font-mono text-[14px] leading-7 text-white/90 list-disc pl-5">
            <li>Home</li>
            <li>Services (accommodations, events, corporate)</li>
            <li>News</li>
            <li>About</li>
            <li>Contact</li>
          </ul>
          <div className="mt-2 font-mono text-[13px] text-white/75">
            Grouped menus reduce clutter and guide flows.
          </div>
        </Panel>
      </div>

      <div className="mt-4">
        <Panel title="/ui/patterns">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {patterns.map((p, i) => (
              <div key={i} className="border p-4" style={{ borderColor: EDGE, backgroundColor: SOFT }}>
                <div className="font-mono text-white/90">{p}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </section>
  );
}
