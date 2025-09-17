// MysteriousDesk.jsx — Reflective floor tuned + faux glow puddles for screen & lamp

import React, { Suspense, useRef, useState, useMemo, useEffect } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Preload,
  useGLTF,
  ScrollControls,
  useScroll,
  MeshReflectorMaterial,
  Environment,
  ContactShadows,
} from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  DepthOfField,
  Noise,
  Vignette,
  ChromaticAberration,
  SSAO,
} from "@react-three/postprocessing";
import { BlendFunction, NormalPass } from "postprocessing";
import CanvasLoader from "../Loader";

/** =========================
 * Screen alignment constants — only used if not embedding
 * ========================= */
const SCREEN_POS = new THREE.Vector3(0.13, 0.1, -0.1);
const SCREEN_ROT = new THREE.Euler(0, 0, 0);
const SCREEN_SCALE = new THREE.Vector3(0.23, 0.2, 1);

/* ------------------------------------------------------------
   Utility textures (LCD base + scanlines)
   ------------------------------------------------------------ */
function usePanelBaseTexture({ w = 768, h = 512 } = {}) {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");

    // dark blue/black vertical gradient with slight vignette
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#04090c");
    g.addColorStop(1, "#000000");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // radial vignette
    const r = ctx.createRadialGradient(
      w / 2,
      h / 2,
      10,
      w / 2,
      h / 2,
      Math.max(w, h) * 0.6
    );
    r.addColorStop(0, "rgba(0,0,0,0)");
    r.addColorStop(1, "rgba(0,0,0,0.45)");
    ctx.fillStyle = r;
    ctx.fillRect(0, 0, w, h);

    const t = new THREE.CanvasTexture(c);
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.generateMipmaps = false;
    return t;
  }, [w, h]);
}

function useScanlineTexture({ w = 768, h = 512, alpha = 0.22 } = {}) {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    ctx.fillStyle = `rgba(0,0,0,${alpha})`;
    for (let y = 0; y < h; y += 2) ctx.fillRect(0, y, w, 1); // 1px dark line every 2px
    const t = new THREE.CanvasTexture(c);
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.generateMipmaps = false;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }, [w, h, alpha]);
}

/* ------------------------------------------------------------
   Digital Snow (denser, higher contrast, rare RGB pixels, thin vertical lines)
   ------------------------------------------------------------ */
function useDigitalSnowTexture({
  w = 768,
  h = 512,
  fps = 24,
  grain = 0.28, // ↑ denser
  colorPixelRate = 0.03, // ↑ more color specks
  lineRate = 0.03, // ↑ more thin verticals
  baseAlpha = 0.12, // ↑ slightly stronger dots
} = {}) {
  const { tex, ctx, c } = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    const tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return { tex, ctx, c };
  }, [w, h]);

  const acc = useRef(0);
  useFrame((_, dt) => {
    acc.current += dt;
    if (acc.current < 1 / fps) return;
    acc.current = 0;

    const W = c.width,
      H = c.height;
    ctx.clearRect(0, 0, W, H);

    // Base gray speckle (transparent background)
    const dotCount = Math.floor(W * H * grain * 0.05);
    for (let i = 0; i < dotCount; i++) {
      const x = (Math.random() * W) | 0;
      const y = (Math.random() * H) | 0;
      const a = baseAlpha * (0.7 + Math.random() * 0.8);
      const v = 190 + ((Math.random() * 60) | 0);
      ctx.fillStyle = `rgba(${v},${v},${v},${a})`;
      ctx.fillRect(x, y, 1, 1);
    }

    // Sparse tiny colored pixels
    const colorDots = Math.floor(W * H * colorPixelRate * 0.001);
    for (let i = 0; i < colorDots; i++) {
      const x = (Math.random() * W) | 0;
      const y = (Math.random() * H) | 0;
      const hue = [160, 175, 190, 350, 5][(Math.random() * 5) | 0];
      const a = 0.35 + Math.random() * 0.6;
      ctx.fillStyle = `hsla(${hue}, 95%, ${
        55 + ((Math.random() * 25) | 0)
      }%, ${a})`;
      ctx.fillRect(x, y, 1, 1);
    }

    // Occasional thin vertical line artifacts
    if (Math.random() < lineRate) {
      const x = (Math.random() * W) | 0;
      const a = 0.18 + Math.random() * 0.25;
      ctx.fillStyle = `rgba(180,180,180,${a})`;
      ctx.fillRect(x, 0, 1, H);
      if (Math.random() < 0.7) {
        ctx.fillStyle = "rgba(0,255,200,0.1)";
        ctx.fillRect(x + 1, 0, 1, H);
        ctx.fillStyle = "rgba(255,60,120,0.08)";
        ctx.fillRect(x - 1, 0, 1, H);
      }
    }

    tex.needsUpdate = true;
  });

  return tex;
}

/* ------------------------------------------------------------
   GPU Glitch texture (bars/slices/pixel blocks + occasional shear)
   ------------------------------------------------------------ */
function useGlitchTexture({
  width = 768,
  height = 512,
  fps = 24,
  bars = 60, // more scan bars
  sliceChance = 0.85, // more wide slices
  pixelChance = 0.4, // more pixel blocks
} = {}) {
  const { tex, ctx, c } = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = width;
    c.height = height;
    const ctx = c.getContext("2d");
    const tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    return { tex, ctx, c };
  }, [width, height]);

  const acc = useRef(0);
  useFrame((_, delta) => {
    acc.current += delta;
    if (acc.current < 1 / fps) return;
    acc.current = 0;

    const w = c.width,
      h = c.height;

    // dark background glow
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#051012");
    g.addColorStop(1, "#000000");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // ----- Horizontal bars (with occasional shear) -----
    ctx.save();

    // small per-frame shear: feels like tearing when it happens
    const shear = Math.random() < 0.25 ? (Math.random() - 0.5) * 0.06 : 0; // -0.03..0.03
    ctx.setTransform(1, 0, shear, 1, 0, 0);

    for (let i = 0; i < bars; i++) {
      const y = Math.floor((i / bars) * h + (Math.random() - 0.5) * 2);
      const bh = Math.max(2, Math.floor((Math.random() * h) / (bars * 1.3))); // thicker bars
      const hue = [180, 190, 200, 330, 350][(Math.random() * 5) | 0];
      const a = 0.55 + Math.random() * 0.45;
      ctx.fillStyle = `hsla(${hue}, 100%, ${
        (45 + Math.random() * 40) | 0
      }%, ${a})`;

      if (Math.random() < sliceChance) {
        const x = Math.floor(Math.random() * w * 0.1);
        const bw = Math.floor(w * (0.6 + Math.random() * 0.4));
        ctx.fillRect(x, y, bw, bh);
      } else {
        const dashCount = 10 + ((Math.random() * 16) | 0);
        for (let d = 0; d < dashCount; d++) {
          const dx = (Math.random() * w) | 0;
          const dw = 18 + ((Math.random() * 120) | 0); // longer dashes
          ctx.fillRect(dx, y, dw, bh);
        }
      }
    }

    ctx.restore(); // remove shear so other passes aren't skewed

    // ----- Pixel blocks -----
    if (Math.random() < pixelChance) {
      const pxCount = 160 + ((Math.random() * 220) | 0);
      for (let p = 0; p < pxCount; p++) {
        const x = (Math.random() * w) | 0;
        const y = (Math.random() * h) | 0;
        const s = 1 + ((Math.random() * 3) | 0);
        const hue = [190, 200, 210, 0, 350][(Math.random() * 5) | 0];
        ctx.fillStyle = `hsla(${hue}, 95%, ${(55 + Math.random() * 35) | 0}%, ${
          0.4 + Math.random() * 0.45
        })`;
        ctx.fillRect(x, y, s, s);
      }
    }

    // ----- Subtle vertical RGB misalignment lines -----
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = "rgba(255,0,120,0.12)";
    ctx.lineWidth = 1;
    for (let v = 0; v < 10; v++) {
      const vx = (Math.random() * w) | 0;
      ctx.beginPath();
      ctx.moveTo(vx, 0);
      ctx.lineTo(vx, h);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";

    tex.needsUpdate = true;
  });

  return tex;
}

/* ------------------------------------------------------------
   Optional logo texture
   ------------------------------------------------------------ */
function useLogoTexture({
  text = "MARJUT • PORTFOLIO",
  sub = "BOOTING...",
  w = 768,
  h = 512,
} = {}) {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(
      w / 2,
      h / 2,
      10,
      w / 2,
      h / 2,
      Math.max(w, h) * 0.65
    );
    g.addColorStop(0, "#0b0f12");
    g.addColorStop(1, "#000");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#1a2a33";
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, w - 16, h - 16);

    ctx.font = "bold 56px Karla, Arial, sans-serif";
    ctx.fillStyle = "#dff6ff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(223,246,255,0.35)";
    ctx.shadowBlur = 16;
    ctx.fillText(text, w / 2, h * 0.48);
    ctx.shadowBlur = 0;

    ctx.font = "normal 28px Karla, Arial, sans-serif";
    ctx.fillStyle = "#8fbccc";
    ctx.fillText(sub, w / 2, h * 0.62);

    // mild dark scanline feel
    const img = ctx.getImageData(0, 0, w, h),
      d = img.data;
    for (let y = 0; y < h; y += 2) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        d[i] *= 0.93;
        d[i + 1] *= 0.93;
        d[i + 2] *= 0.93;
      }
    }
    ctx.putImageData(img, 0, 0);

    const t = new THREE.CanvasTexture(c);
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.generateMipmaps = false;
    return t;
  }, [text, sub, w, h]);
  return tex;
}

/* ------------------------------------------------------------
   LaptopScreen — darker base, stronger snow/glitch, scanlines, subtle flicker
   ------------------------------------------------------------ */
export function LaptopScreen({
  color = "#cbd0ce",
  onGlitchKick,
  embedded = false,
  planeSize = [1, 0.6],
  flip = false,
}) {
  const [w, h] = planeSize;

  // Palette & balances
  const IDLE_FILL_COLOR = "#bfe4ef"; // tint glow color (very soft)
  const IDLE_HALO_COLOR = "#9befff";
  const IDLE_FILL_STRENGTH = 0.03; // lower panel wash
  const IDLE_EMISSIVE_BASE = 2.3; // ↑ snow/glitch drive the glow
  const ACTIVE_EMISSIVE_BASE = 0.7;
  const AREA_LIGHT_COLOR = "#aeeaff";

  const wrapperRotation = flip ? [0, Math.PI, 0] : [0, 0, 0];
  const layerZ = 0.0001;

  const ScreenWrapper = ({ children }) =>
    embedded ? (
      <group rotation={wrapperRotation}>{children}</group>
    ) : (
      <group position={SCREEN_POS} rotation={SCREEN_ROT} scale={SCREEN_SCALE}>
        <group rotation={wrapperRotation}>{children}</group>
      </group>
    );

  // refs
  const idleFillMatRef = useRef();
  const idleHaloMatRef = useRef();
  const snowMatRef = useRef();
  const logoMainRef = useRef();
  const logoGhostRRef = useRef();
  const logoGhostBRef = useRef();
  const glitchMatRef = useRef();
  const scanlineMatRef = useRef();
  const rectAreaRef = useRef();

  // textures
  const panelBaseTex = usePanelBaseTexture();
  const scanlineTex = useScanlineTexture();
  const snowTex = useDigitalSnowTexture({
    w: 768,
    h: 512,
    grain: 0.28,
    colorPixelRate: 0.03,
    lineRate: 0.03,
    baseAlpha: 0.12,
  });
  const logoTex = useLogoTexture();
  const glitchTex = useGlitchTexture({ width: 768, height: 512, bars: 60 });

  // scroll/activity + phases
  const scroll = useScroll();
  const prevOffset = useRef(0);
  const activity = useRef(0);
  const PHASE = useRef("idle");
  const timer = useRef(0);
  const started = useRef(false);

  const T_FLASH = 0.12;
  const T_GLITCH_A = 0.25;
  const T_LOGO_IN = 0.35;
  const T_LOGO_HOLD = 0.45;
  const T_LOGO_OUT = 0.3;
  const T_GLITCH_B = 0.28;

  const smoothstep01 = (x) => {
    const t = THREE.MathUtils.clamp(x, 0, 1);
    return t * t * (3 - 2 * t);
  };
  const remap = (x, a, b) => THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);

  // animated values
  const idleFill = useRef(0);
  const idleHalo = useRef(0);
  const areaIntensity = useRef(0);

  useFrame((_, delta) => {
    const p = scroll?.offset ?? 0;
    const dp = p - prevOffset.current;
    prevOffset.current = p;

    // start sequence on first nudge
    if (!started.current && (p > 0.001 || Math.abs(dp) > 0.0005)) {
      started.current = true;
      PHASE.current = "flash";
      timer.current = 0;
    }

    // timeline
    timer.current += delta;
    if (PHASE.current === "flash" && timer.current >= T_FLASH) {
      PHASE.current = "glitchA";
      timer.current = 0;
      onGlitchKick?.(1);
    } else if (PHASE.current === "glitchA" && timer.current >= T_GLITCH_A) {
      PHASE.current = "logo";
      timer.current = 0;
    } else if (
      PHASE.current === "logo" &&
      timer.current >= T_LOGO_IN + T_LOGO_HOLD + T_LOGO_OUT
    ) {
      PHASE.current = "glitchB";
      timer.current = 0;
      onGlitchKick?.(1);
    } else if (PHASE.current === "glitchB" && timer.current >= T_GLITCH_B) {
      PHASE.current = "active";
      timer.current = 0;
    }

    // scroll velocity → activity (for reactive glitch)
    const vel = dp / Math.max(delta, 1e-4);
    const targetAct = smoothstep01(remap(Math.abs(vel) * 12, 0.02, 1));
    activity.current = THREE.MathUtils.damp(
      activity.current,
      targetAct,
      targetAct > activity.current ? 10 : 3.5,
      delta
    );

    const isIdle = PHASE.current === "idle";
    const breathe = 0.5 + 0.5 * Math.sin(performance.now() * 0.002);

    // Idle sources: soft fill/halo; area light carries ambient spill
    const targetFill =
      (isIdle ? IDLE_FILL_STRENGTH : 0.16) + (isIdle ? 0.07 * breathe : 0.0);
    const targetHalo = (isIdle ? 0.65 : 0.18) + (isIdle ? 0.1 * breathe : 0.0);

    // keep some area light active
    const targetArea = isIdle ? 7.5 + 2 * breathe : 4.2;

    idleFill.current = THREE.MathUtils.damp(
      idleFill.current,
      targetFill,
      6,
      delta
    );
    idleHalo.current = THREE.MathUtils.damp(
      idleHalo.current,
      targetHalo,
      6,
      delta
    );
    areaIntensity.current = THREE.MathUtils.damp(
      areaIntensity.current,
      targetArea,
      6,
      delta
    );
    if (rectAreaRef.current)
      rectAreaRef.current.intensity = areaIntensity.current;

    if (idleHaloMatRef.current)
      idleHaloMatRef.current.opacity = THREE.MathUtils.clamp(
        idleHalo.current,
        0,
        1
      );
    if (idleFillMatRef.current)
      idleFillMatRef.current.opacity = THREE.MathUtils.clamp(
        idleFill.current,
        0,
        1
      );

    // Digital snow: stronger & flickers slightly with activity
    if (snowMatRef.current) {
      const burst =
        PHASE.current === "glitchA" || PHASE.current === "glitchB" ? 0.7 : 1.0;
      const baseOpacity = 1.2 * (0.9 + 0.28 * activity.current) * burst; // ↑ visibility
      snowMatRef.current.opacity = THREE.MathUtils.clamp(baseOpacity, 0, 1);

      const targetEmissive =
        (isIdle
          ? IDLE_EMISSIVE_BASE
          : ACTIVE_EMISSIVE_BASE + 0.35 * activity.current) +
        0.12 * breathe;
      snowMatRef.current.emissive = new THREE.Color("#b6faff");
      snowMatRef.current.emissiveIntensity = THREE.MathUtils.damp(
        snowMatRef.current.emissiveIntensity ?? 0,
        targetEmissive,
        6,
        delta
      );
      snowMatRef.current.color = new THREE.Color(color);
    }

    // Logo opacity
    let a = 0;
    if (PHASE.current === "flash") {
      a = 0.25 * (1 - timer.current / T_FLASH);
    } else if (PHASE.current === "logo") {
      const u = timer.current;
      const inA = THREE.MathUtils.clamp(u / T_LOGO_IN, 0, 1);
      const outA = THREE.MathUtils.clamp(
        (u - (T_LOGO_IN + T_LOGO_HOLD)) / T_LOGO_OUT,
        0,
        1
      );
      a = inA * (1 - outA);
    }
    const mainA = THREE.MathUtils.clamp(a, 0, 1);
    if (logoMainRef.current) {
      logoMainRef.current.opacity = mainA;
      logoMainRef.current.color?.set("#ffffff");
    }
    if (logoGhostRRef.current) logoGhostRRef.current.opacity = 0.12 * mainA;
    if (logoGhostBRef.current) logoGhostBRef.current.opacity = 0.1 * mainA;

    // Glitch opacity — stronger peaks + more during scroll
    if (glitchMatRef.current) {
      let g = 0.0;
      if (PHASE.current === "glitchA") {
        g = Math.sin(Math.PI * (timer.current / T_GLITCH_A)) * 1.6;
      } else if (PHASE.current === "glitchB") {
        g =
          Math.pow(Math.sin(Math.PI * (timer.current / T_GLITCH_B)), 0.9) * 1.6;
      } else {
        g = 0.7 * activity.current;
      }
      glitchMatRef.current.opacity = THREE.MathUtils.clamp(g, 0, 1);
    }

    // very light scanline flicker
    if (scanlineMatRef.current) {
      const s =
        0.18 +
        0.03 * Math.sin(performance.now() * 0.004) +
        0.05 * activity.current;
      scanlineMatRef.current.opacity = THREE.MathUtils.clamp(s, 0.12, 0.28);
    }
  });

  return (
    <ScreenWrapper>
      {/* Back halo (for bloom) */}
      <mesh position={[0, 0, layerZ * 1]} renderOrder={10}>
        <planeGeometry args={[w * 1, h * 1]} />
        <meshBasicMaterial
          ref={idleHaloMatRef}
          transparent
          toneMapped={false}
          blending={THREE.AdditiveBlending}
          color={IDLE_HALO_COLOR}
          depthTest={true}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Dark panel base (LCD off-black) */}
      <mesh position={[0, 0, layerZ * 1.5]} renderOrder={10}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial
          map={panelBaseTex}
          transparent={false}
          toneMapped={false}
          side={THREE.DoubleSide}
          depthTest={true}
          depthWrite={false}
        />
      </mesh>

      {/* Inner fill – soft powered-on tint (very low) */}
      <mesh position={[0, 0, layerZ * 2]} renderOrder={11}>
        <planeGeometry args={[w * 0.998, h * 0.998]} />
        <meshBasicMaterial
          ref={idleFillMatRef}
          transparent
          toneMapped={false}
          color={IDLE_FILL_COLOR}
          depthTest={true}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Digital snow */}
      <mesh position={[0, 0, layerZ * 3]} renderOrder={15}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial
          ref={snowMatRef}
          map={snowTex}
          transparent
          toneMapped={false}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={true}
          side={THREE.DoubleSide}
          emissive={"#b6faff"}
          emissiveIntensity={2.5}
        />
      </mesh>

      {/* Logo main */}
      <mesh position={[0, 0, layerZ * 4]} renderOrder={13}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial
          ref={logoMainRef}
          map={logoTex}
          transparent
          toneMapped={false}
          blending={THREE.AdditiveBlending}
          opacity={0}
          side={THREE.DoubleSide}
          depthTest={true}
          depthWrite={false}
        />
      </mesh>

      {/* chroma ghosts */}
      <mesh position={[0, 0, layerZ * 5]} renderOrder={13}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial
          ref={logoGhostRRef}
          map={logoTex}
          transparent
          toneMapped={false}
          color="#ff3e7f"
          opacity={0}
          depthTest={true}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0, layerZ * 6]} renderOrder={13}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial
          ref={logoGhostBRef}
          map={logoTex}
          transparent
          toneMapped={false}
          color="#34e5ff"
          opacity={0}
          depthTest={true}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* GPU glitch */}
      <mesh position={[0, 0, layerZ * 7]} renderOrder={16}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial
          ref={glitchMatRef}
          map={glitchTex}
          transparent
          toneMapped={false}
          blending={THREE.AdditiveBlending}
          opacity={0}
          side={THREE.DoubleSide}
          depthTest={true}
          depthWrite={false}
        />
      </mesh>

      {/* Scanlines (multiply) */}
      <mesh position={[0, 0, layerZ * 7.5]} renderOrder={17}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial
          ref={scanlineMatRef}
          map={scanlineTex}
          transparent
          toneMapped={false}
          blending={THREE.MultiplyBlending}
          depthTest={true}
          depthWrite={false}
          side={THREE.DoubleSide}
          opacity={0.2}
          premultipliedAlpha={true}
        />
      </mesh>

      {/* Protective glass */}
      <mesh position={[0, 0, layerZ * 8]} renderOrder={20}>
        <planeGeometry args={[w, h]} />
        <meshPhysicalMaterial
          transparent
          transmission={0.9}
          thickness={0.02}
          roughness={0.45}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.2}
          reflectivity={0.4}
          ior={1.5}
          color="#ffffff"
          opacity={0.85}
          side={THREE.DoubleSide}
          depthTest={true}
        />
      </mesh>

      {/* Rect Area Light — always on (dimmer when active) */}
      <rectAreaLight
        ref={rectAreaRef}
        args={["#aeeaff", 1, w * 0.95, h * 0.95]}
        position={[0, 0, layerZ * 10]}
        lookAt={[0, 0, 1]}
        intensity={areaIntensity.current}
        side={THREE.DoubleSide}
      />
    </ScreenWrapper>
  );
}

/* ------------------------------------------------------------
   Camera rig
   ------------------------------------------------------------ */
function CameraRigWithHandoff({
  onEnter,
  mode = "forward",
  reverseDuration = 1.2,
}) {
  const { camera } = useThree();
  const scroll = useScroll();

  const vFrom = useMemo(() => new THREE.Vector3(0, 24, 39), []);
  const vTo = useMemo(() => new THREE.Vector3(0.0, 14, 20), []);
  const lookFrom = useMemo(() => new THREE.Vector3(0, 11, 25), []);
  const lookTo = useMemo(() => new THREE.Vector3(0, 8, 14), []);

  const tmpPos = useMemo(() => new THREE.Vector3(), []);
  const tmpLook = useMemo(() => new THREE.Vector3(), []);
  const enteredRef = useRef(false);
  const reverseClock = useRef(0);

  useFrame((_, delta) => {
    const ease = (x) =>
      x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

    let t = 0;
    if (mode === "forward") {
      const raw = THREE.MathUtils.clamp(scroll.offset, 0, 1);
      t = ease(raw);
      tmpPos.lerpVectors(vFrom, vTo, t);
      tmpLook.lerpVectors(lookFrom, lookTo, t);
      camera.position.lerp(tmpPos, 0.12);
      camera.lookAt(tmpLook);
      const fovFrom = 90,
        fovTo = 15;
      camera.fov +=
        (THREE.MathUtils.lerp(fovFrom, fovTo, t) - camera.fov) * 0.12;
      camera.updateProjectionMatrix();
      if (!enteredRef.current && raw > 0.9) {
        enteredRef.current = true;
        onEnter?.();
      }
    } else {
      reverseClock.current = Math.min(
        reverseClock.current + delta,
        reverseDuration
      );
      const u = reverseClock.current / reverseDuration;
      t = 1 - ease(u);
      tmpPos.lerpVectors(vFrom, vTo, t);
      tmpLook.lerpVectors(lookFrom, lookTo, t);
      camera.position.copy(tmpPos);
      camera.lookAt(tmpLook);
      const fovFrom = 100,
        fovTo = 15;
      camera.fov = THREE.MathUtils.lerp(fovFrom, fovTo, t);
      camera.updateProjectionMatrix();
      if (scroll?.el) scroll.el.scrollTop = 0;
    }
  });

  return null;
}

/* ------------------------------------------------------------
   Attach helper to mount things as a child of a GLTF node
   ------------------------------------------------------------ */
function AttachToObject({ object, children }) {
  const group = useRef();
  useEffect(() => {
    if (!object || !group.current) return;
    object.add(group.current);
    return () => object.remove(group.current);
  }, [object]);
  return <group ref={group}>{children}</group>;
}

/* ------------------------------------------------------------
   Main desk/laptop scene
   ------------------------------------------------------------ */
const Desk = ({ isMobile, showStatic = true }) => {
  const desk = useGLTF("./desk/desk.glb");
  const lamp = useGLTF("./lamp/lampSquareTable.glb");
  const laptop = useGLTF("./laptop1/scene.gltf");

  useEffect(() => {
    [desk.scene, laptop.scene, lamp.scene].forEach((root) => {
      root.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
          if (o.material) o.material.needsUpdate = true;
        }
      });
    });
  }, [desk, laptop, lamp]);

  const screenNode = useMemo(
    () => laptop.scene.getObjectByName("Screen_Screen_0"),
    [laptop]
  );

  const planeSize = useMemo(() => {
    if (!screenNode || !screenNode.geometry) return [1, 0.6];
    const geom = screenNode.geometry;
    if (!geom.boundingBox) geom.computeBoundingBox();
    const size = new THREE.Vector3();
    geom.boundingBox.getSize(size);
    return [size.x, size.y];
  }, [screenNode]);

  useEffect(() => {
    if (screenNode) screenNode.frustumCulled = false;
  }, [screenNode]);

  const scroll = useScroll();
  const bloomIntensityRef = useRef(0.8);

  const glitchBoost = useRef(0);

  useFrame((_, delta) => {
    const p = scroll?.offset ?? 0;
    const approach = THREE.MathUtils.smoothstep(p, 0.05, 0.45);
    // Slightly stronger minimum so snow/glitch catch bloom
    bloomIntensityRef.current = 1.35 + 1.0 * approach;

    glitchBoost.current = THREE.MathUtils.damp(
      glitchBoost.current,
      0,
      3.5,
      delta
    );
  });

  const handleGlitchKick = () => {
    glitchBoost.current = 1;
  };

  return (
    <group rotation={[-0.15, 0, 0]}>
      {/* lights */}
      <ambientLight intensity={0.03} color="#0b0b0b" />
      <hemisphereLight
        intensity={0.15}
        skyColor="#0f1116"
        groundColor="#000000"
      />

      {/* desk */}
      <primitive
        object={desk.scene}
        scale={isMobile ? 0.7 : 17}
        position={isMobile ? [-1.75, 1.9, 17] : [-6, -3.9, 17]}
        rotation={[-0.45, 0, 0]}
        receiveShadow
        toneMapped
      />

      {/* laptop + embedded screen */}
      <group
        scale={isMobile ? 0.7 : 12}
        position={isMobile ? [-1.75, 1.9, 17] : [-0.5, 0.95, 12]}
        rotation={[-0.45, 0, 0]}
      >
        <primitive object={laptop.scene} receiveShadow castShadow />

        {showStatic && screenNode && (
          <AttachToObject object={screenNode}>
            <group scale={[1, 1.06, 1]} position={[0, 0.133, 0]}>
              <LaptopScreen
                embedded
                planeSize={planeSize}
                flip
                onGlitchKick={handleGlitchKick}
              />
            </group>
          </AttachToObject>
        )}

        <rectAreaLight
          args={["#bfe4ef", 2, 1.2, 0.7]}
          position={[0, 0.1, 0.1]} // just in front of screen
          rotation={[0, 0, 0]}
          intensity={2.5}
        />

        {/* shadow catcher just above the reflector */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.545, 15]}
          receiveShadow
          renderOrder={2}
        >
          <planeGeometry args={[100, 100]} />
          <shadowMaterial opacity={0.35} />
        </mesh>

        {/* ---- Reflective Floor (TUNED) ---- */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.555, 15]} // just under your desk
          receiveShadow
        >
          <planeGeometry args={[100, 100]} />
          <MeshReflectorMaterial
            mirror={0.89}
            roughness={0.06}
            metalness={0.3}
            color="#fdfdfd"
            blur={[80, 30]}
            mixStrength={6}
            depthScale={0.3}
            envMapIntensity={0.5}
            reflectorOffset={0.03}
            resolution={2048}
          />
        </mesh>
      </group>

      {/* lamp */}
      <group
        position={isMobile ? [-1.75, 1.9, 17] : [3, 1.7, 13.5]}
        rotation={[-0.45, 0, 0]}
        scale={isMobile ? 0.7 : 9}
      >
        <primitive object={lamp.scene} />
        <pointLight
          position={[0.05, 0.3, 0]}
          color="#fff8e6"
          intensity={1.6}
          distance={6}
          decay={2}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <spotLight
          color="#ffe8c2"
          position={[0.1, 1.1, 0.2]}
          target-position={[0, -1.0, 0.8]}
          angle={0.65} // wider cone
          penumbra={0.8} // softer edges
          intensity={4.0} // stronger!
          distance={9} // reaches further
          castShadow
        />

        <ContactShadows
          position={[0, -0.52, 14.5]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={20}
          opacity={0.6}
          blur={2.5}
          far={5}
        />
      </group>

      {/* post-processing */}
      <EffectComposer>
        <Bloom
          mipmapBlur
          intensity={0.9}
          luminanceThreshold={0.08}
          luminanceSmoothing={0.45}
        />
        <DepthOfField
          focusDistance={0.0001}
          focalLength={0.002}
          bokehScale={0.5}
          height={600}
        />
        <ChromaticAberration
          offset={[
            0.0002 +
              0.0006 * bloomIntensityRef.current +
              0.005 * glitchBoost.current,
            0,
          ]}
          radialModulation
          modulationOffset={0.3}
        />
        <Noise
          premultiply
          blendFunction={BlendFunction.SOFT_LIGHT}
          opacity={0.08 + 0.12 * glitchBoost.current}
        />
        <Vignette eskil={false} offset={0.4} darkness={0.6} />

        {/* <NormalPass /> */}

{/*         <SSAO
          samples={16}
          radius={0.25}
          intensity={1.2}
          luminanceInfluence={0.5}
        /> */}
      </EffectComposer>
    </group>
  );
};

/* ------------------------------------------------------------
   Canvas wrapper
   ------------------------------------------------------------ */
export default function MysteriousDeskCanvas({
  onEnterScreen,
  mode = "forward",
  onProjectTarget,
}) {
  const [isMobile] = useState(false);
  const screenRef = useRef(null);

  return (
    <Canvas
      frameloop="always"
      shadows
      dpr={[1, 1.25]}
      camera={{ position: [0, 15, 26], fov: 90 }}
      gl={{
        antialias: false,
        powerPreference: "high-performance",
        alpha: false,
        depth: true,
        stencil: true,
        physicallyCorrectLights: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        outputEncoding: THREE.sRGBEncoding,
        shadowMap: {
          enabled: true,
          type: THREE.PCFSoftShadowMap,
          autoUpdate: true,
        },
      }}
    >
      <color attach="background" args={["#000000"]} />
      {/*        <fog attach="fog" args={["#050505", 12, 40]} /> */}

      {/* virtual scroll */}
      <ScrollControls pages={2} damping={0.18}>
        <Suspense fallback={<CanvasLoader />}>
          <Desk isMobile={isMobile} />
          <Preload all />
        </Suspense>
        <ProjectFlashTarget targetRef={screenRef} onProject={onProjectTarget} />
        <CameraRigWithHandoff onEnter={onEnterScreen} mode={mode} />
      </ScrollControls>
    </Canvas>
  );
}

/* ------------------------------------------------------------
   Helper: projects a world point to screen % (unchanged)
   ------------------------------------------------------------ */
function ProjectFlashTarget({ targetRef, onProject }) {
  const { camera } = useThree();
  const vec = useMemo(() => new THREE.Vector3(), []);
  const prev = useRef({ x: 50, y: 50 });
  useFrame(() => {
    if (!targetRef?.current) return;
    targetRef.current.getWorldPosition(vec);
    vec.project(camera);
    const xPct = (vec.x * 0.5 + 0.5) * 100;
    const yPct = (1 - (vec.y * 0.5 + 0.5)) * 100;
    if (
      Math.abs(xPct - prev.current.x) > 0.2 ||
      Math.abs(yPct - prev.current.y) > 0.2
    ) {
      prev.current = { x: xPct, y: yPct };
      onProject?.({ x: xPct, y: yPct });
    }
  });
  return null;
}
