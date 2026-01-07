// src/components/case-studies/ali-ketola/sections/ImplementSection.jsx
import React from "react";
import { SectionHeader, Panel } from "../shared/ui";
import { buildPoints } from "../content";

export default function Implement() {
  return (
    <section id="implement" className="mt-12">
      <SectionHeader label="IMPLEMENT" title="Build & Handoff" />
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="/build">
          <ul className="list-disc pl-5 space-y-2 font-mono text-[14px] leading-7 text-white/90">
            {buildPoints.map((b, i) => (<li key={i}>{b}</li>))}
          </ul>
        </Panel>
        <Panel title="/cta/booking-preference">
          <p className="font-mono text-[14px] leading-7 text-white/90">
            Reinforced client preference for direct contact: sticky booking CTA + clear phone/email
            strips instead of complex on-site checkout.
          </p>
        </Panel>
      </div>
    </section>
  );
}
