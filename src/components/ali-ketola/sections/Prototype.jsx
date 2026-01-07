// src/components/case-studies/ali-ketola/sections/PrototypeSection.jsx
import React from "react";
import { SectionHeader, Panel } from "../shared/ui";

export default function Prototype() {
  return (
    <section id="prototype" className="mt-12">
      <SectionHeader label="PROTOTYPE" title="Hi-Fi Direction" />
      <p className="mt-3 font-mono text-[15px] leading-7 text-white/85 max-w-3xl">
        A welcoming, rustic-inspired look paired with modern structure: genuine on-site photography,
        forest-green and warm beige accents, and modular card layouts for scannability.
      </p>
      <div className="mt-4">
        <Panel title="/links/prototypes">
          <div className="font-mono text-[14px] text-white/80">
            Prototype links (desktop/mobile) available on request.
          </div>
        </Panel>
      </div>
    </section>
  );
}
