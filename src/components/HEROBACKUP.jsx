// HEROBACKUP.jsx
import React, { useEffect, useState, useCallback } from "react";
import { styles } from "../styles";
import MysteriousDeskCanvas from "./canvas/MysteriousDesk";
import MatrixBG from "./canvas/MatrixBG";

// === Effect timings (ms) ===
const BARS_DURATION_MS = 600;
const STATIC_DURATION_MS = 600;
const FLASH_DURATION_MS = 180; // quick CRT pop
const SETTLE_DURATION_MS = 500; // subtle scanline/vignette settle
const ABERR_DURATION_MS = 320; // subtle RGB split duration

// Lock body scroll during the 3D intro
function useBodyScrollLocked(locked) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = locked ? "hidden" : "";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
}

function BootType({ lines, speed = 22 }) {
  const [text, setText] = React.useState("");
  React.useEffect(() => {
    let i = 0,
      joined = lines.join("\n");
    const id = setInterval(() => {
      setText(joined.slice(0, i++));
      if (i > joined.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [lines, speed]);
  return (
    <pre className="p-3 md:p-4 text-[12px] md:text-sm leading-relaxed text-emerald-300/90 font-mono whitespace-pre-wrap">
      {text}
      <span className="inline-block w-2 h-4 align-[-2px] bg-emerald-300/90 animate-pulse ml-1" />
    </pre>
  );
}

export default function Hero({ onEntered, reenter3D = false }) {
  const [entered, setEntered] = useState(false);
  const [bars, setBars] = useState(false);
  const [staticNoise, setStaticNoise] = useState(false);
  const [flash, setFlash] = useState(false);
  const [settle, setSettle] = useState(false);
  const [aberr, setAberr] = useState(false);

  // Re-enter request puts you back into the 3D scene
  useEffect(() => {
    if (reenter3D) {
      setEntered(false);
      setBars(false);
      setStaticNoise(false);
      setFlash(false);
      setSettle(false);
      setAberr(false);
    }
  }, [reenter3D]);

  // Keep page from scrolling until we "enter" the site
  useBodyScrollLocked(!entered);

  const handleEnter = useCallback(() => {
    // Bars → Static → Flash → reveal content → aberration → settle
    setBars(true);
    setTimeout(() => {
      setBars(false);
      setStaticNoise(true);
      setTimeout(() => {
        setStaticNoise(false);
        setFlash(true);
        setTimeout(() => {
          setFlash(false);
          setEntered(true); // reveal content FIRST so step 5/6 sit on top of site

          // Step 6: brief chromatic aberration (more visible now)
          setAberr(true);
          setTimeout(() => setAberr(false), ABERR_DURATION_MS);

          // Step 5: subtle scanline/vignette settle after aberration starts
          setSettle(true);
          setTimeout(() => {
            setSettle(false);
            onEntered?.();
          }, SETTLE_DURATION_MS);
        }, FLASH_DURATION_MS);
      }, STATIC_DURATION_MS);
    }, BARS_DURATION_MS);
  }, [onEntered]);

  return (
    <section id="hero" className="relative w-full h-screen mx-auto">
      {/* Phase A: 3D scene */}
      {!entered && !bars && !staticNoise && !flash && !settle && !aberr && (
        <div className="fixed inset-0 z-30">
          <MysteriousDeskCanvas mode="forward" onEnterScreen={handleEnter} />

          {/* Optional: keep a Skip for dev convenience */}
          <button
            onClick={handleEnter}
            className="absolute z-50 top-4 right-4 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur px-4 py-2 text-white text-sm"
          >
            Skip intro ↦
          </button>
        </div>
      )}

      {/* Step 2 effect: SMPTE-style bars */}
      {bars && (
        <>
          <style>{`
            @keyframes fadeInOut {
              0% { opacity: 0 }
              10% { opacity: 1 }
              90% { opacity: 1 }
              100% { opacity: 0 }
            }
          `}</style>
          <div
            className="fixed inset-0 z-40 grid grid-cols-7"
            style={{
              animation: `fadeInOut ${BARS_DURATION_MS}ms ease forwards`,
            }}
          >
            {[
              "#ff0000",
              "#00ff00",
              "#0000ff",
              "#ffff00",
              "#00ffff",
              "#ff00ff",
              "#ffffff",
            ].map((c, i) => (
              <div key={i} style={{ backgroundColor: c }} />
            ))}
          </div>
        </>
      )}

      {/* Step 3 effect: rolling static */}
      {staticNoise && (
        <>
          <style>{`
            @keyframes staticFade {
              0% { opacity: 0 }
              10% { opacity: 1 }
              90% { opacity: 1 }
              100% { opacity: 0 }
            }
          `}</style>
          <div
            className="fixed inset-0 z-40 bg-black"
            style={{
              animation: `staticFade ${STATIC_DURATION_MS}ms ease forwards`,
            }}
          >
            <div
              className="w-full h-full"
              style={{
                backgroundImage: `url('https://media.giphy.com/media/oEI9uBYSzLpBK/giphy.gif')`,
                backgroundSize: "cover",
                opacity: 0.9,
              }}
            />
          </div>
        </>
      )}

      {/* Step 4 effect: CRT flash */}
      {flash && (
        <>
          <style>{`
            @keyframes flashPop {
              0% { opacity: 0 }
              15% { opacity: 1 }
              70% { opacity: 1 }
              100% { opacity: 0 }
            }
            @keyframes splitWobble {
              0% { transform: translate(0,0) }
              50% { transform: translate(-1px, 1px) }
              100% { transform: translate(0,0) }
            }
          `}</style>
          <div className="fixed inset-0 z-50 pointer-events-none">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.6) 35%, rgba(255,255,255,0) 70%)",
                animation: `flashPop ${FLASH_DURATION_MS}ms ease-out forwards`,
              }}
            />
            <div
              className="absolute inset-0 mix-blend-screen"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(255,0,0,.20) 0%, rgba(255,0,0,0) 60%)",
                filter: "blur(1px)",
                transform: "translate(-1px, -0.5px)",
                animation: `flashPop ${FLASH_DURATION_MS}ms ease-out forwards, splitWobble ${FLASH_DURATION_MS}ms ease-out`,
              }}
            />
            <div
              className="absolute inset-0 mix-blend-screen"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(0,128,255,.22) 0%, rgba(0,128,255,0) 60%)",
                filter: "blur(1px)",
                transform: "translate(1px, 0.5px)",
                animation: `flashPop ${FLASH_DURATION_MS}ms ease-out forwards, splitWobble ${FLASH_DURATION_MS}ms ease-out`,
              }}
            />
          </div>
        </>
      )}

      {/* Step 5 effect: subtle scanline/vignette settle */}
      {settle && (
        <>
          <style>{`
            @keyframes settleFade {
              0% { opacity: 0 }
              15% { opacity: .45 }
              85% { opacity: .25 }
              100% { opacity: 0 }
            }
            @keyframes slightDrift {
              0% { transform: translateY(0) }
              50% { transform: translateY(0.6px) }
              100% { transform: translateY(0) }
            }
          `}</style>
          <div
            className="fixed inset-0 z-40 pointer-events-none"
            style={{
              animation: `settleFade ${SETTLE_DURATION_MS}ms ease-out forwards`,
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, rgba(255,255,255,.06) 0 1px, rgba(0,0,0,0) 1px 3px)",
                backgroundSize: "100% 3px",
                mixBlendMode: "screen",
                opacity: 0.45,
                animation: `slightDrift ${SETTLE_DURATION_MS}ms ease-out`,
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,.25) 100%)",
              }}
            />
          </div>
        </>
      )}

      {/* Step 6 effect: chromatic aberration settle */}
      {aberr && (
        <>
          <style>{`
            @keyframes aberrR {
              0% { opacity: .34; transform: translate(-2px, -1.5px) }
              100% { opacity: 0; transform: translate(0,0) }
            }
            @keyframes aberrC {
              0% { opacity: .34; transform: translate(2px, 1.5px) }
              100% { opacity: 0; transform: translate(0,0) }
            }
          `}</style>
          <div className="fixed inset-0 z-50 pointer-events-none">
            <div
              className="absolute inset-0 mix-blend-screen"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(255,0,0,.25) 0%, rgba(255,0,0,0) 60%)",
                filter: "blur(0.7px)",
                animation: `aberrR ${ABERR_DURATION_MS}ms ease-out forwards`,
              }}
            />
            <div
              className="absolute inset-0 mix-blend-screen"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(0,180,255,.27) 0%, rgba(0,180,255,0) 60%)",
                filter: "blur(0.7px)",
                animation: `aberrC ${ABERR_DURATION_MS}ms ease-out forwards`,
              }}
            />
          </div>
        </>
      )}

      {/* Phase B: site content */}
      <div
        className={`absolute inset-0 top-[160px] max-w-7xl mx-auto ${
          styles.paddingX
        } flex flex-row items-start gap-5 z-10 pointer-events-none ${
          entered ? "opacity-100" : "opacity-0"
        }`}
        style={{ transition: "opacity 200ms ease" }}
      >
        <div className="max-w-3xl pointer-events-auto">
          {/* Terminal card */}
          <div className="mb-6 rounded-xl border border-emerald-400/30 bg-black/50 backdrop-blur-sm shadow-[0_0_40px_rgba(20,255,160,.08)] overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-emerald-400/20 text-xs text-emerald-300/80">
              <span className="w-2 h-2 rounded-full bg-emerald-400/70" />
              <span className="uppercase tracking-widest">/bin/boot</span>
            </div>
            <BootType
              /* ↓ Refined narrative: the machine reveals the user cleanly */
              lines={[
                "link eth0 up  —  OK",
                "mount /portfolio  —  OK",
                "start gpu: glitch-core  —  OK",
                "start renderer: mysterious-desk  —  OK",
                "hand-off to userland  —  READY",
                "",
                "$ whoami",
                "marjut",
                "",
                "$ cat ~/hello.txt",
                "Welcome inside the machine.",
                "",
                "$ _",
              ]}
            />
          </div>

          {/* Brand heading (no duplicate “Hi, I’m …”) */}
          <h1 className={`${styles.heroHeadText} text-white`}>
            {/* Mobile: stacked (hidden on md and up) */}
            <span className="text-emerald-400 block md:hidden">
              Marjut
              <br />
              Ala-Ketola
            </span>

            {/* Desktop: one line (hidden below md) */}
            <span className="text-emerald-400 hidden md:inline whitespace-nowrap">
              Marjut Ala-Ketola
            </span>
          </h1>
          <p className={`${styles.heroSubText} mt-2 text-emerald-200/80`}>
            Software Developer — Web · 3D · UX
          </p>
        </div>
      </div>
    </section>
  );
}
