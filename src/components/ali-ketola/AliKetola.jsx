import React from "react";
import SectionTitleStyles from "./shared/SectionTitleStyles";
import { StepNav } from "./shared/ui";
import { SectionWrapper } from "/src/hoc";

import Hero from "./sections/Hero";
import Define from "./sections/Define";
import Ideate from "./sections/Ideate";
import Prototype from "./sections/Prototype";
import Implement from "./sections/Implement";
import Validate from "./sections/Validate";
import Nav from "./sections/Nav";

function AliKetola() {
  return (
    <>
      <SectionTitleStyles />
      {/* ...Title + Meta/Impact block you already have... */}
      <Hero />
      <div className="mt-24 md:mt-32 xl:mt-40 space-y-24 md:space-y-32 xl:space-y-40">
        <Nav />
        <Define />
        <Ideate />
        <Prototype />
        <Implement />
        <Validate />
      </div>
    </>
  );
}

export default SectionWrapper(AliKetola, "ali-ketola");
