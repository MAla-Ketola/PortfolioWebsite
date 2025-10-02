// =========================
// App.jsx — adds a floating "Back to desk" to re-enter the 3D scene
// =========================
import { BrowserRouter, useLocation } from "react-router-dom";
import React, { useState, useEffect } from "react";
import {
  About,
  Contact,
  Experience,
  Navbar,
  Tech,
  Works,
  Hero,
} from "./components";
import RootMatrixBG from "./components/canvas/RootMatrixBG";

function MatrixOrchestrator() {
  React.useEffect(() => {
    const root = document.documentElement;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target;
          root.style.setProperty("--mx-speed",   el.dataset.mxSpeed   ?? "1");
          root.style.setProperty("--mx-density", el.dataset.mxDensity ?? "1.05");
          root.style.setProperty("--mx-opacity", el.dataset.mxOpacity ?? "0.16");
        });
      },
      { threshold: 0.51 }
    );
    document.querySelectorAll("[data-mx-section]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}

const App = () => {
  const [entered, setEntered] = useState(false); // inside the site content
  const [reenter3D, setReenter3D] = useState(false); // trigger reverse flight


  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const smallScreen = window.matchMedia("(max-width: 768px)").matches;
    if (prefersReduced || smallScreen) setEntered(true); // auto-skip heavy 3D
  }, []);

  const handleBackToDesk = () => {
    // show the 3D overlay and play reverse animation once
    setReenter3D(true);
    setEntered(false);
    // reset the flag on the next tick so future clicks work again
    setTimeout(() => setReenter3D(false), 0);
  };

  return (
    <BrowserRouter>
      {/* 1) Global matrix behind EVERYTHING */}
      {entered && <RootMatrixBG />}

      {/* 2) All site content above it */}
      <div className="relative z-10">
        {/* Hero overlay lives here and signals when we’re "inside" */}
        <div
          className={`${entered ? "bg-transparent" : "bg-black"} ${
            entered ? "min-h-screen" : "h-screen"
          } ${entered ? "" : "overflow-hidden"}`}
        >
          <Navbar />
          <Hero
            reenter3D={reenter3D}
            onEntered={() => setEntered(true)}
          />
        </div>

        {/* Render the real site sections AFTER the intro */}
        {entered && (
          <>
            {/* Floating Back to desk button */}
  {/*           <button
              onClick={handleBackToDesk}
              className="fixed bottom-6 right-6 z-40 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur px-4 py-2 text-white text-sm"
            >
              Back to desk
            </button> */}

            {/* 3) Make sure sections don’t create opaque layers */}
            <section className="relative z-10 w-full min-h-screen">
              <About id="about" data-mx-section data-mx-speed="0.85" data-mx-density="0.95" data-mx-opacity="0.12" className="relative" />
            </section>

            <section className="relative z-10">
              <Works />
            </section>

            <section className="relative z-10">
              {/* <Tech /> */}
            </section>

            <section className="relative z-10">
              <Experience />
            </section>

            <section className="relative z-10">
              <Contact />
            </section>
          </>
        )}
      </div>
    </BrowserRouter>
  );
};

export default App;

{
  /* bg-hero-pattern bg-cover bg-no-repeat bg-center */
}
