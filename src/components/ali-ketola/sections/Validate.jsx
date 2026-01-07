// src/components/case-studies/ali-ketola/sections/ValidateSection.jsx
import React from "react";
import { SectionHeader, Panel, Stat } from "../shared/ui";
import { validateStats, topFlows, feedback, wentWell, opportunities, lessons } from "../content";

export default function Validate() {
  return (
    <section id="validate" className="mt-12">
      <SectionHeader label="VALIDATE" title="Outcomes & Reflections" />

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="/metrics">
          <div className="space-y-3">
            {validateStats.map((s, i) => (<Stat key={i} {...s} />))}
          </div>
          <ul className="mt-4 list-disc pl-5 space-y-1 font-mono text-[13px] text-white/85">
            {topFlows.map((f, i) => (<li key={i}>{f}</li>))}
          </ul>
        </Panel>

        <Panel title="/feedback">
          <ul className="list-disc pl-5 space-y-2 font-mono text-[14px] leading-7 text-white/90">
            {feedback.map((f, i) => (<li key={i}>“{f}”</li>))}
          </ul>
        </Panel>

        <Panel title="/what-went-well">
          <ul className="list-disc pl-5 space-y-2 font-mono text-[14px] leading-7 text-white/90">
            {wentWell.map((w, i) => (<li key={i}>{w}</li>))}
          </ul>
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="/opportunities">
          <ul className="list-disc pl-5 space-y-2 font-mono text-[14px] leading-7 text-white/90">
            {opportunities.map((o, i) => (<li key={i}>{o}</li>))}
          </ul>
        </Panel>
        <Panel title="/lessons">
          <ul className="list-disc pl-5 space-y-2 font-mono text-[14px] leading-7 text-white/90">
            {lessons.map((l, i) => (<li key={i}>{l}</li>))}
          </ul>
        </Panel>
      </div>
    </section>
  );
}
