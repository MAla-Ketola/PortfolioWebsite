import React, {
  useRef,
  Suspense,
  useMemo,
  useState,
  useId,
  useEffect,
} from "react";
import { Canvas, useLoader, useFrame, useThree } from "@react-three/fiber";
import {
  Float,
  Sparkles,
  PerspectiveCamera,
  Resize,
  Center,
  ContactShadows,
} from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import SplineLoader from "@splinetool/loader";
import * as THREE from "three";
import CanvasLoader from "./Loader";

/**
 * Helper: replace all Spline materials with safe MeshStandardMaterial
 * (prevents Spline node-material shader issues)
 */
function styleSplineObject(spline) {
  spline.traverse((child) => {
    if (child?.isObject3D) child.raycast = () => null;

    if (child?.isMesh) {
      child.raycast = THREE.Mesh.prototype.raycast;

      const name = (child.name || "").toLowerCase();
      const isCenter = name.includes("sphere") || name.includes("center");

      child.material = new THREE.MeshStandardMaterial({
        color: isCenter ? "#ffeebb" : "#ffc4d6",
        roughness: 0.12,
        metalness: 0.1,
        emissive: isCenter ? "#ffaa00" : "#ff88aa",
        emissiveIntensity: isCenter ? 0.5 : 0.2,
      });
    }
  });

  return spline;
}

/**
 * Find nearest scroll container. If none, returns window.
 * Works for full-screen layouts that scroll inside a wrapper.
 */
function getScrollParent(node) {
  if (!node) return window;
  let parent = node.parentElement;

  while (parent) {
    const style = window.getComputedStyle(parent);
    const overflowY = style.overflowY;
    const isScrollable =
      (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") &&
      parent.scrollHeight > parent.clientHeight;

    if (isScrollable) return parent;
    parent = parent.parentElement;
  }

  return window;
}

/**
 * --- MAIN 3D FLOWER (Hero Tile) ---
 */
const HeroScene = ({ boostBloom = 0 }) => {
  const { gl } = useThree();

  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.2;
  }, [gl]);

  const rawSpline = useLoader(
    SplineLoader,
    "https://prod.spline.design/Rec6PcROBqV3gDTB/scene.splinecode"
  );
  const spline = useMemo(() => styleSplineObject(rawSpline), [rawSpline]);

  const spinRef = useRef();
  const [hovered, setHovered] = useState(false);
  const rotationSpeed = useRef(0);

  useFrame((_, delta) => {
    if (!spinRef.current) return;

    const targetSpeed = hovered ? 3 : 0;
    rotationSpeed.current += (targetSpeed - rotationSpeed.current) * 4 * delta;

    spinRef.current.rotation.z -= rotationSpeed.current * delta;
    spinRef.current.rotation.z -= (hovered ? 0 : 0.18) * delta;
  });

  const bloomIntensity =
    0.55 + (hovered ? 0.18 : 0) + Math.min(0.35, boostBloom);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={40} />
      <ambientLight intensity={0.85} color="#ffe0f0" />
      <directionalLight position={[5, 10, 5]} intensity={2.5} color="#fff0f5" />
      <spotLight
        position={[-5, 5, -5]}
        intensity={4}
        color="#ffffff"
        angle={0.5}
        penumbra={1}
      />

      <Float
        speed={2}
        rotationIntensity={0.55}
        floatIntensity={1}
        floatingRange={[-0.1, 0.1]}
      >
        <group
          ref={spinRef}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            setHovered(false);
          }}
        >
          <Resize scale={4.9}>
            <Center>
              <primitive object={spline} />
            </Center>
          </Resize>
        </group>
      </Float>

      <ContactShadows
        position={[0, -3.35, 0]}
        opacity={0.16}
        scale={9}
        blur={2}
        far={4}
        color="#2b2b2b"
      />

      <EffectComposer disableNormalPass>
        <Bloom
          luminanceThreshold={0.82}
          mipmapBlur
          intensity={bloomIntensity}
          radius={0.35}
        />
      </EffectComposer>

      <Sparkles
        count={26}
        scale={10}
        size={2}
        speed={0.35}
        opacity={0.45 + Math.min(0.25, boostBloom)}
        color="#ffffff"
      />
    </>
  );
};

/**
 * --- MINI 3D FLOWER (Scroll Indicator) ---
 * Load separately using a cache-busting query
 */
const MiniFlowerScene = ({ hovered = false }) => {
  const rawSpline = useLoader(
    SplineLoader,
    "https://prod.spline.design/Rec6PcROBqV3gDTB/scene.splinecode?mini=1"
  );
  const spline = useMemo(() => styleSplineObject(rawSpline), [rawSpline]);

  const ref = useRef();

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.z -= (hovered ? 0.9 : 0.45) * delta;
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 9]} fov={42} />
      <ambientLight intensity={0.55} color="#fff3fb" />
      <directionalLight position={[4, 8, 6]} intensity={1.8} color="#ffffff" />

      <Float
        speed={hovered ? 2.6 : 2.0}
        rotationIntensity={0.35}
        floatIntensity={0.8}
        floatingRange={[-0.08, 0.08]}
      >
        <group ref={ref}>
          <Resize scale={6}>
            <Center>
              <primitive object={spline} />
            </Center>
          </Resize>
        </group>
      </Float>
    </>
  );
};

const Tile = ({ className = "", style = {}, children }) => (
  <div
    className={[
      "relative overflow-hidden rounded-[32px] border border-black/5",
      "shadow-[0_22px_80px_rgba(131,24,67,0.16)]",
      "transition-transform duration-300 hover:-translate-y-[2px]",
      className,
    ].join(" ")}
    style={style}
  >
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/40 via-white/10 to-transparent" />
    {children}
  </div>
);

const ScrollFlowerIndicator = ({ onClick }) => {
  const pathId = useId().replace(/:/g, "");
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      aria-label="Scroll down"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      className="group relative h-28 w-28 md:h-32 md:w-32 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#831843]/35"
    >
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .scrollRing { animation: spinRing 10s linear infinite; transform-origin: 50% 50%; }
          .group:hover .scrollRing { animation-duration: 6s; }
          .miniFloat { animation: miniBob 1.8s ease-in-out infinite; }
        }
        @keyframes spinRing { to { transform: rotate(360deg); } }
        @keyframes miniBob { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-3px); } }
      `}</style>

      <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full">
        <defs>
          <path
            id={pathId}
            d="M60,60 m-42,0 a42,42 0 1,1 84,0 a42,42 0 1,1 -84,0"
          />
        </defs>

        <g className="scrollRing">
          <text className="fill-[#831843] font-mono text-[9px] tracking-[0.28em] uppercase">
            <textPath href={`#${pathId}`} startOffset="0%">
              {"scroll down • scroll down • scroll down • "}
            </textPath>
          </text>
        </g>
      </svg>

      <div className="absolute inset-0 grid place-items-center">
        <div className="miniFloat relative h-12 w-12 md:h-14 md:w-14">
          <div className="absolute inset-0 pointer-events-none">
            <Canvas
              className="w-full h-full"
              dpr={[1, 1.5]}
              gl={{ antialias: true, alpha: true }}
            >
              <Suspense fallback={null}>
                <MiniFlowerScene hovered={hovered} />
              </Suspense>
            </Canvas>
          </div>
        </div>
      </div>
    </button>
  );
};

const Hero = () => {
  const [bloomBoost, setBloomBoost] = useState(0);

  const heroRef = useRef(null);
  const scrollerRef = useRef(window);

  // cue animation config
  const CUE_SIZE = 128; // ~ h-32 w-32
  const PEEK_HIDE_PX = CUE_SIZE * 0.55; // half hidden at start
  const REVEAL_DISTANCE = 10; // px of scroll to reveal fully
  const FADE_START_RATIO = 0.05; // start fade when 65% through hero
  const FADE_DISTANCE = 120; // fade over px

  const [cueStyle, setCueStyle] = useState({
    y: PEEK_HIDE_PX,
    opacity: 1,
    interactive: true,
  });

  const triggerBurst = () => {
    setBloomBoost(0.35);
    window.setTimeout(() => setBloomBoost(0), 500);
  };

  // Scroll in the same scroller that actually scrolls the page
  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (!el) {
      window.location.hash = `#${id}`;
      return;
    }

    const NAV_OFFSET = 112;
    const scroller = scrollerRef.current || window;

    if (scroller === window) {
      const y = el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
      window.scrollTo({ top: y, behavior: "smooth" });
      return;
    }

    // element scroll container case
    const scrollerRect = scroller.getBoundingClientRect();
    const targetRect = el.getBoundingClientRect();
    const y =
      scroller.scrollTop + (targetRect.top - scrollerRect.top) - NAV_OFFSET;

    scroller.scrollTo({ top: y, behavior: "smooth" });
  };

  // ✅ cue reveal + fade: listen to the ACTUAL scroll container
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;

    const scroller = getScrollParent(el);
    scrollerRef.current = scroller;

    const listenTarget = scroller === window ? window : scroller;

    let raf = 0;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const heroHeight = rect.height;

      const inView = rect.bottom > 0 && rect.top < window.innerHeight;
      if (!inView) {
        setCueStyle((prev) =>
          prev.opacity === 0
            ? prev
            : { y: PEEK_HIDE_PX, opacity: 0, interactive: false }
        );
        raf = 0;
        return;
      }

      const localY = Math.min(Math.max(0, -rect.top), heroHeight);

      // reveal (half-hidden -> full)
      const revealT = Math.min(Math.max(localY / REVEAL_DISTANCE, 0), 1);
      const translateY = (1 - revealT) * PEEK_HIDE_PX;

      // fade near bottom of hero
      const fadeStart = heroHeight * FADE_START_RATIO;
      const fadeT = Math.min(
        Math.max((localY - fadeStart) / FADE_DISTANCE, 0),
        1
      );
      const opacity = 1 - fadeT;

      setCueStyle({
        y: translateY,
        opacity,
        interactive: opacity > 0.05,
      });

      raf = 0;
    };

    const scheduleUpdate = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    // initial + listeners
    update();
    listenTarget.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      listenTarget.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative w-full h-screen bg-[#F7F3E9] pt-28 pb-8 px-4 md:px-8 overflow-hidden"
    >
      <div className="pointer-events-none absolute -top-28 -left-28 h-80 w-80 rounded-full bg-[#F8C8DC]/55 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-[#BDE0FE]/55 blur-3xl" />

      <div className="relative w-full max-w-7xl mx-auto h-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
          {/* TEXT TILE */}
          <Tile
            className="lg:col-span-6 h-full"
            style={{ backgroundColor: "#FEF9E7" }}
          >
            <div className="relative h-full p-6 md:p-10 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/65 px-4 py-2 border border-black/5 w-fit">
                <span className="font-mono text-[11px] tracking-widest uppercase text-[#831843]/80">
                  Portfolio
                </span>
                <span className="h-1 w-1 rounded-full bg-[#831843]/35" />
                <span className="font-mono text-[11px] tracking-widest uppercase text-[#831843]/80">
                  2026
                </span>
              </div>

              <h1 className="mt-6 font-serif italic text-5xl md:text-7xl text-[#831843] leading-[0.95]">
                Hi, I’m{" "}
                <span className="not-italic font-sans font-black">Marjut</span>
              </h1>

              <p className="mt-5 text-[#831843]/90 font-medium text-base md:text-lg max-w-xl leading-relaxed">
                A Creative Developer building bold, accessible, and memorable
                digital experiences.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {["React", "Tailwind", "Three.js", "UX", "UI Dev"].map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-white/65 border border-black/5 px-3 py-1 text-sm text-[#831843]/80"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#contact"
                  onClick={(e) => {
                    e.preventDefault();
                    triggerBurst();
                    scrollToId("contact");
                  }}
                  className="inline-flex items-center justify-center bg-[#831843] text-white font-bold px-6 py-3 rounded-full shadow-lg hover:scale-[1.03] hover:bg-[#a01d52] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#831843]/40"
                >
                  Contact Me
                </a>

                <a
                  href="#projects"
                  onClick={(e) => {
                    e.preventDefault();
                    triggerBurst();
                    scrollToId("projects");
                  }}
                  className="inline-flex items-center justify-center border-2 border-[#831843] text-[#831843] font-bold px-6 py-3 rounded-full hover:bg-[#831843]/10 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#831843]/30"
                >
                  View Work
                </a>
              </div>
            </div>
          </Tile>

          {/* FLOWER TILE */}
          <Tile
            className="lg:col-span-6 h-[42vh] lg:h-full"
            style={{ backgroundColor: "#BDE0FE" }}
          >
            <div className="relative h-full w-full p-4 md:p-6">
              <div className="relative h-full w-full rounded-[28px] overflow-hidden">
                <div className="absolute inset-0">
                  <Canvas className="w-full h-full">
                    <Suspense fallback={<CanvasLoader />}>
                      <HeroScene boostBloom={bloomBoost} />
                    </Suspense>
                  </Canvas>
                </div>
              </div>
            </div>
          </Tile>
        </div>

        {/* SCROLL CUE: half visible at first, reveals on scroll, fades out near end of hero */}
        <div
          className="fixed left-1/2 bottom-0 z-50 transition-[transform,opacity] duration-300"
          style={{
            transform: `translateX(-50%) translateY(${cueStyle.y}px)`,
            opacity: cueStyle.opacity,
            pointerEvents: cueStyle.interactive ? "auto" : "none",
          }}
        >
          <ScrollFlowerIndicator
            onClick={() => {
              triggerBurst();
              scrollToId("about");
            }}
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;




