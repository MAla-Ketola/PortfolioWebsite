import React, { useRef, useMemo, useLayoutEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import {
  EffectComposer,
  Bloom,
  Noise,
  Vignette,
  ChromaticAberration,
  Scanline,
  Glitch,
  DepthOfField,
} from "@react-three/postprocessing";
import { BlendFunction, GlitchMode } from "postprocessing";

import { Suspense } from 'react';
import { Preload, AdaptiveDpr } from '@react-three/drei';
import Loader from "../Loader";

const GLYPHS =
  "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(
    ""
  );

// Small helper to draw from an exponential distribution (for Poisson-like event timing)
const expInterval = (eventsPerSecond) =>
  eventsPerSecond > 0
    ? -Math.log(1 - Math.random()) / eventsPerSecond
    : Infinity;

// ---------- camera frustum area ----------
function useFrustumArea({ zNear = -6, zFar = -28, overhang = 0.1 } = {}) {
  const { camera, viewport } = useThree();
  const near = viewport.getCurrentViewport(camera, [0, 0, zNear]);
  const far = viewport.getCurrentViewport(camera, [0, 0, zFar]);
  const width = Math.max(near.width, far.width) * (1 + overhang);
  const height = Math.max(near.height, far.height) * (1 + overhang);
  return React.useMemo(
    () => ({
      x: width * 0.5,
      yTop: height * 0.5,
      yBottom: -height * 0.5,
      zNear,
      zFar,
    }),
    [width, height, zNear, zFar]
  );
}

// ---------- shared round glow texture (created once) ----------
let __RADIAL_TEX__ = null;
function getRadialGlowTexture(size = 256) {
  if (__RADIAL_TEX__) return __RADIAL_TEX__;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  g.addColorStop(0.0, "rgba(255,255,255,1)");
  g.addColorStop(0.4, "rgba(255,255,255,0.55)");
  g.addColorStop(0.85, "rgba(255,255,255,0.10)");
  g.addColorStop(1.0, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  __RADIAL_TEX__ = tex;
  return tex;
}

// ---------- public wrapper ----------
export default function MatrixBG({
  density = 1.2,
  speed = 1.2,
  glow = 0.6,
  opacity = 1,
  // keep pointer-events-none so the background never blocks UI
  className = "absolute inset-0 -z-10 pointer-events-none",
}) {
  return (
    <div className={className} style={{ opacity }}>
      {/* Your existing scene */}
      <Canvas
        dpr={[
          1,
          Math.min(
            2,
            typeof window !== "undefined" ? window.devicePixelRatio : 2
          ),
        ]}
        camera={{ position: [0, 0, 2], fov: 60, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl }) => gl.setClearColor("#000", 1)}
      >
        <Suspense fallback={<Loader />}>
        <Scene density={density} speed={speed} glow={glow} />
        <Preload all />
      </Suspense>
      <AdaptiveDpr pixelated />
      </Canvas>

      {/* Diagonal shimmer — ultra-slow sweep */}
      <div className="pointer-events-none absolute inset-0 ak-matrix-shimmer" />

      <style>{`
        .ak-matrix-shimmer {
          background: linear-gradient(
            30deg,
            transparent,
            rgba(178,90,255,0.08),
            rgba(255,61,222,0.05),
            transparent
          );
          background-size: 300% 300%;
          mix-blend-mode: screen;
          animation: akShimmer 24s linear infinite;
        }
        @keyframes akShimmer {
          0% { background-position: 110% 0%; }
          100% { background-position: -10% 100%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ak-matrix-shimmer { animation: none; }
        }
      `}</style>
    </div>
  );
}

// ---------- the rain ----------
export function MatrixStreams({
  streams = 80,
  area = { x: 14, yTop: 9, yBottom: -9, zNear: -6, zFar: -28 },
  speedFactor = 1,
  baseColor = "#A8FFDC",

  // flicker + sparkle behaviour
  flickersPerSecond = 10,
  changesPerFlicker = 3,
  sparkleRunsPerSecond = 0.8,
  sparkleAvgLength = 5,
  sparkleSpeed = 28,
  sparkleGlowBoost = 0.22,
  sparkleAlphaBoost = 0.2,

  // head/tail brightness shaping
  endGlowBoost = 0.35,
  endAlphaBoost = 0.35,
  endGlowSpan = 3,

  // halo around bright tail part (softened a touch)
  tailHaloWidth = 0.08,
  tailHaloBlur = 0.5,

  // overall body brightness
  headBaseLightness = 0.7,
  bodyBaseLightness = 0.52,
  alphaFalloff = 0.024,
  bodyLightnessLift = 0.06,
  bodyAlphaLift = 0.06,

  // head bulb (depth aware)
  headBulbSize = 0.85,
  headBulbIntensity = 1.6,
  bulbSizeNear = 1.2,
  bulbSizeFar = 0.6,
  bulbIntensityNear = 1.3,
  bulbIntensityFar = 0.7,
  bulbWidthMul = 0.7,
  bulbHeightMul = 1.35,
  trailLength = 1.6,
  trailOpacity = 0.35,

  // Overlap-proof lane controls
  minSize = 0.75,
  maxSize = 1.1,
  glyphWidthMul = 0.9,
  letterSpacingFactor = 1.05,
  lanePadding = 1.2,
  laneJitter = 0.08,

  // CodeBurst controls
  burstChancePerSecond = 0.035,
  burstExtraGlow = 0.35,
  burstSpeedBoost = 1.75,

  // Compression ripple controls
  ripplePeriod = 7.5,
  rippleHeight = 1.8,
  rippleStrength = 0.25,

  // prevents neighbours from getting closer than ~1 glyph height
  minVisualSpacing = 0.97,

  // soft fade distance near the top/bottom edges
  edgeFade = 2.2,
  edgeScaleEase = 0.25,
}) {
  // ------- utils -------
  const rnd = (a, b) => Math.random() * (b - a) + a;
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const smooth01 = (t) => t * t * (3 - 2 * t);
  const pickNewGlyph = (exclude) => {
    let g;
    do g = GLYPHS[(Math.random() * GLYPHS.length) | 0];
    while (g === exclude);
    return g;
  };

  // edge visibility helper (1 in the middle, 0 at the extreme edges)
  const edgeVis = (y, top, bottom, fade) => {
    const kTop = clamp01((top - y) / fade);
    const kBot = clamp01((y - bottom) / fade);
    return smooth01(Math.min(kTop, kBot));
  };

  // ------- lane math -------
  const laneMath = React.useMemo(() => {
    const totalWidth = area.x * 2;
    const widestGlyphHalf = maxSize * glyphWidthMul * letterSpacingFactor * 0.5;
    const safetyMul = 3; // generous glow margin
    const glowMargin = maxSize * 0.5 * safetyMul;
    const laneMinWidth = Math.max(
      widestGlyphHalf * 2 * lanePadding + glowMargin,
      widestGlyphHalf * 2 * 1.2
    );
    const laneCountCap = Math.max(1, Math.floor(totalWidth / laneMinWidth));
    return { totalWidth, widestGlyphHalf, laneMinWidth, laneCountCap };
  }, [area.x, maxSize, glyphWidthMul, letterSpacingFactor, lanePadding]);

  const sizes = React.useMemo(
    () => Array.from({ length: streams }, () => rnd(minSize, maxSize)),
    [streams, minSize, maxSize]
  );

  const usedStreams = Math.min(streams, laneMath.laneCountCap);
  const lanes = React.useMemo(() => {
    const arr = [];
    if (usedStreams === 1) arr.push(0);
    else {
      for (let i = 0; i < usedStreams; i++) {
        const t = (i + 0.5) / usedStreams;
        arr.push(-area.x + t * laneMath.totalWidth);
      }
    }
    return arr;
  }, [usedStreams, area.x, laneMath.totalWidth]);

  // ------- per-stream state -------
  const data = React.useMemo(() => {
    const arr = [];
    for (let i = 0; i < usedStreams; i++) {
      const size = sizes[i];
      const laneCenter = lanes[i];
      const safeHalf = laneMath.laneMinWidth * 0.5 - laneMath.widestGlyphHalf;
      const jitter = Math.min(safeHalf * laneJitter, 0.25);
      const x = laneCenter + (jitter > 0 ? rnd(-jitter, jitter) : 0);
      const tailLen = rnd(12, 24) | 0;

      // seed chars with no duplicates next to each other
      const chars = new Array(tailLen);
      for (let gi = 0; gi < tailLen; gi++) {
        const prev = gi > 0 ? chars[gi - 1] : null;
        chars[gi] = pickNewGlyph(prev);
      }

      arr.push({
        x,
        laneCenter,
        size,
        z: rnd(area.zFar, area.zNear),
        headY: rnd(area.yBottom, area.yTop),
        fall: rnd(2.2, 4.2) * speedFactor,
        baseOpacity: rnd(0.4, 0.7),
        hueJitter: rnd(-6, 0),
        tailLen,
        chars,
        distAccum: 0,
        charStep: 1.05,

        // sparkle state
        sparkActive: false,
        sparkStart: 2,
        sparkLen: 5,
        sparkProg: 0,
        sparkLastStep: -1,
        nextSparkle: expInterval(sparkleRunsPerSecond),

        // CodeBurst
        burstActive: false,
        burstT: 0,
        burstDur: rnd(0.5, 0.8),
        burstSpeedMul: 1.0,
        nextBurst: expInterval(burstChancePerSecond),

        // background flickers
        nextFlicker: expInterval(flickersPerSecond),

        // smoothed speed multipliers
        speedMul: 1.0,
        targetSpeedMul: 1.0,
      });
    }
    return arr;
  }, [
    usedStreams,
    sizes,
    lanes,
    area,
    speedFactor,
    laneMath.laneMinWidth,
    laneMath.widestGlyphHalf,
    laneJitter,
    sparkleRunsPerSecond,
    burstChancePerSecond,
    flickersPerSecond,
  ]);

  // flattened index for refs
  const baseIndex = React.useMemo(() => {
    const idx = [];
    let acc = 0;
    for (let i = 0; i < data.length; i++) {
      idx.push(acc);
      acc += data[i].tailLen;
    }
    return idx;
  }, [data]);

  // refs
  const refs = React.useRef([]);
  refs.current = [];
  const glowSpritesRef = React.useRef([]);
  glowSpritesRef.current = [];
  const trailSpritesRef = React.useRef([]);
  trailSpritesRef.current = [];

  // shared sprite textures + materials
  const baseColorThree = React.useMemo(
    () => new THREE.Color(baseColor),
    [baseColor]
  );
  const radialTex = React.useMemo(() => getRadialGlowTexture(256), []);

  const spriteMat = React.useMemo(
    () =>
      new THREE.SpriteMaterial({
        map: radialTex,
        color: baseColorThree,
        transparent: true,
        opacity: 0.9 * headBulbIntensity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        alphaTest: 0.01,
      }),
    [radialTex, baseColorThree, headBulbIntensity]
  );

  const trailMat = React.useMemo(
    () =>
      new THREE.SpriteMaterial({
        map: radialTex,
        color: baseColorThree,
        transparent: true,
        opacity: trailOpacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        alphaTest: 0.01,
      }),
    [radialTex, baseColorThree, trailOpacity]
  );

  // ------- animation -------
  useFrame((state, dt) => {
    const t = state.clock.getElapsedTime();
    const { zNear: zN, zFar: zF, yTop, yBottom } = area;

    // compression wave Y (top -> bottom)
    const sweepSpan = yTop - yBottom + rippleHeight;
    const waveY = yTop - ((t % ripplePeriod) / ripplePeriod) * sweepSpan;

    for (let si = 0; si < data.length; si++) {
      const s = data[si];

      // --- timers ---
      s.nextBurst -= dt;
      if (!s.burstActive && s.nextBurst <= 0) {
        s.burstActive = true;
        s.burstT = 0;
        s.burstDur = rnd(0.5, 0.8);
        s.burstSpeedMul = burstSpeedBoost;
        s.nextBurst = expInterval(burstChancePerSecond);
      }
      if (s.burstActive) {
        s.burstT += dt;
        if (s.burstT >= s.burstDur) {
          s.burstActive = false;
          s.burstSpeedMul = 1.0;
        }
      }

      s.nextFlicker -= dt;
      if (s.nextFlicker <= 0) {
        const n = Math.max(1, Math.min(changesPerFlicker, s.tailLen - 1));
        for (let k = 0; k < n; k++) {
          const j = 1 + ((Math.random() * (s.tailLen - 1)) | 0);
          let g = pickNewGlyph(s.chars[j]);
          if (j > 0 && g === s.chars[j - 1]) g = pickNewGlyph(s.chars[j - 1]);
          s.chars[j] = g;
        }
        s.nextFlicker = expInterval(flickersPerSecond);
      }

      s.nextSparkle -= dt;
      if (!s.sparkActive && s.nextSparkle <= 0) {
        s.sparkActive = true;
        s.sparkStart = Math.min(s.tailLen - 2, 1 + ((Math.random() * 3) | 0));
        s.sparkLen = Math.max(
          3,
          Math.min(
            7,
            Math.round(rnd(sparkleAvgLength - 1, sparkleAvgLength + 2))
          )
        );
        s.sparkProg = 0;
        s.sparkLastStep = -1;
        s.nextSparkle = expInterval(sparkleRunsPerSecond);
      }
      if (s.sparkActive) {
        s.sparkProg += sparkleSpeed * dt;
        const stepNow = Math.floor(s.sparkProg);
        if (stepNow !== s.sparkLastStep) {
          const j = s.sparkStart + stepNow;
          if (j > 0 && j < s.tailLen) {
            let g = pickNewGlyph(s.chars[j]);
            if (j > 0 && g === s.chars[j - 1]) g = pickNewGlyph(s.chars[j - 1]);
            s.chars[j] = g;
          }
          s.sparkLastStep = stepNow;
        }
        if (s.sparkProg >= s.sparkLen) s.sparkActive = false;
      }
      // --- /timers ---

      // smooth speed multiplier
      const desiredMul = s.burstActive ? s.burstSpeedMul : 1.0;
      const easeK = clamp01(dt * 6);
      s.speedMul += (desiredMul - s.speedMul) * easeK;
      s.speedMul = Math.max(0.001, s.speedMul);

      // fall
      const fallNow = s.fall * s.speedMul;
      s.headY -= fallNow * dt;

      // shift tail by base glyph height (constant physics spacing)
      const baseStep = s.charStep * s.size;
      s.distAccum += fallNow * dt;
      while (s.distAccum >= baseStep) {
        s.distAccum -= baseStep;
        for (let gi = s.tailLen - 1; gi > 0; gi--)
          s.chars[gi] = s.chars[gi - 1];
        const below = s.chars[1];
        s.chars[0] = pickNewGlyph(below);
      }

      // Compute the *highest* possible Y of the tail's last glyph (conservative).
      // If even that is below the bottom edge, the entire stream is off-screen.
      const tailTopMostY = s.headY + (s.tailLen - 1) * baseStep;
      if (tailTopMostY < yBottom) {
        // Respawn above the top (with some spacing so it slides in naturally).
        s.headY = yTop + s.tailLen * s.size * rnd(0.2, 1.0);
        s.z = rnd(area.zFar, area.zNear);
        s.distAccum = 0;
        const safeHalf = laneMath.laneMinWidth * 0.5 - laneMath.widestGlyphHalf;
        const jitter = Math.min(safeHalf * laneJitter, 0.25);
        s.x = s.laneCenter + (jitter > 0 ? rnd(-jitter, jitter) : 0);

        // reseed chars
        for (let gi = 0; gi < s.tailLen; gi++) {
          const prev = gi > 0 ? s.chars[gi - 1] : null;
          s.chars[gi] = pickNewGlyph(prev);
          if (gi > 0 && s.chars[gi] === s.chars[gi - 1]) {
            s.chars[gi] = pickNewGlyph(s.chars[gi - 1]);
          }
        }

        s.sparkActive = false;
        s.burstActive = false;
        s.burstSpeedMul = 1.0;
        s.speedMul = 1.0;
        s.targetSpeedMul = 1.0;
        s.nextBurst = expInterval(burstChancePerSecond);
        s.nextFlicker = expInterval(flickersPerSecond);
        s.nextSparkle = expInterval(sparkleRunsPerSecond);
      }

      // depth factor
      const depthT = clamp01((s.z - zN) / (zF - zN));
      const d = smooth01(depthT);

      // draw glyphs with ripple + spacing clamp
      const hueBase = 310 + s.hueJitter + Math.sin((t + si) * 0.1) * 6;

      let prevY = undefined;
      const minGap = baseStep * minVisualSpacing;

      for (let gi = 0; gi < s.tailLen; gi++) {
        const idx = baseIndex[si] + gi;
        const m = refs.current[idx];
        if (!m) continue;

        // 1) base physics position
        // 2) visual compression from ripple (bounded)
        const posYRaw = s.headY + gi * s.charStep * s.size;
        const dy = Math.abs(posYRaw - waveY);
        const inWave = dy < rippleHeight * 0.5;
        const localMul = inWave
          ? Math.max(minVisualSpacing, 1 - rippleStrength)
          : 1;

        let posY = s.headY + gi * (s.charStep * localMul) * s.size;

        // enforce minimum visual spacing vs previous glyph
        if (prevY !== undefined && posY - prevY < minGap) posY = prevY + minGap;
        prevY = posY;

        // position (with tiny z bump)
        m.position.set(s.x, posY, s.z + gi * 1e-4);

        // colour/alpha shaping
        const isHead = gi === 0;
        const sparkFront = s.sparkActive ? s.sparkStart + s.sparkProg : -999;
        const isSparked =
          s.sparkActive &&
          gi >= s.sparkStart &&
          gi <= Math.min(s.tailLen - 1, Math.floor(sparkFront));

        let lightness = isHead ? headBaseLightness : bodyBaseLightness;
        let alpha = isHead
          ? Math.min(1.0, s.baseOpacity + 0.35)
          : Math.max(0.1, s.baseOpacity - gi * alphaFalloff);

        if (gi <= endGlowSpan) {
          const giForBoost = Math.max(1, gi);
          const k = 1 - giForBoost / Math.max(1, endGlowSpan);
          const depthFade = 1 - (1 - 0.75) * d;
          lightness = Math.min(0.99, lightness + endGlowBoost * k * depthFade);
          alpha = Math.min(1.0, alpha + endAlphaBoost * k * depthFade);
        } else {
          const depthFade = 1 - (1 - 0.85) * d;
          const downTail = 1 - (gi / s.tailLen) * 0.6;
          lightness = Math.min(
            0.9,
            lightness + bodyLightnessLift * depthFade * downTail
          );
          alpha = Math.min(0.9, alpha + bodyAlphaLift * depthFade * downTail);
        }

        if (isSparked) {
          lightness = Math.min(0.99, lightness + sparkleGlowBoost * 0.6);
          alpha = Math.min(1.0, alpha + sparkleAlphaBoost * 0.6);
        }

        if (s.burstActive) {
          const k = 1 - Math.min(1, s.burstT / s.burstDur);
          lightness = Math.min(
            0.99,
            lightness + burstExtraGlow * (0.6 + 0.4 * k)
          );
          alpha = Math.min(1.0, alpha + burstExtraGlow * (0.5 + 0.5 * k));
        }

        // apply gentle edge fade (prevents hard cut at bounds)
        alpha *= edgeVis(posY, yTop, yBottom, edgeFade);

        const hue = isHead ? hueBase : hueBase - (isSparked ? 2 : 6);
        if (m.color?.setHSL) m.color.setHSL(hue / 360, 1, lightness);

        if (m.material) {
          m.material.opacity = alpha;
          m.material.transparent = true;
          m.material.depthWrite = false;
          m.material.blending = THREE.AdditiveBlending;
        }

        // glyph text — mutate via ref only (no React children)
        if (m.text !== s.chars[gi]) {
          m.text = s.chars[gi];
          m.sync?.();
        }

        // halo (soft)
        const giForHalo = Math.max(1, gi);
        const haloK =
          gi <= endGlowSpan ? 1 - giForHalo / Math.max(1, endGlowSpan) : 0;
        if ("outlineWidth" in m) m.outlineWidth = tailHaloWidth * haloK;
        if ("outlineBlur" in m) m.outlineBlur = haloK > 0 ? tailHaloBlur : 0;
        if ("outlineColor" in m) m.outlineColor = baseColor;
      }

      // ---------- head glow & trail sprites ----------
      const depthT2 = clamp01((s.z - zN) / (zF - zN));
      const d2 = smooth01(depthT2);
      const sizeMul = THREE.MathUtils.lerp(bulbSizeNear, bulbSizeFar, d2);
      const intensityMul = THREE.MathUtils.lerp(
        bulbIntensityNear,
        bulbIntensityFar,
        d2
      );
      const pulse = 1 + Math.sin(t * 5.5 + si * 0.7) * 0.08;
      const headMatchK = 1 - 1 / Math.max(1, endGlowSpan);

      const laneHalf = laneMath.laneMinWidth * 0.5;
      const maxSpriteHalfX = Math.max(
        0.05,
        laneHalf - laneMath.widestGlyphHalf
      );

      const spr = glowSpritesRef.current[si];
      if (spr) {
        const scale = headBulbSize * s.size * sizeMul * pulse * headMatchK;
        const desiredX = scale * bulbWidthMul;
        const clampedX = Math.min(desiredX, maxSpriteHalfX);
        const burstMul = s.burstActive ? 1.15 : 1.0;
        spr.position.set(s.x, s.headY, s.z + 0.01);
        spr.scale.set(clampedX * burstMul, scale * bulbHeightMul * burstMul, 1);
        spr.material.opacity = Math.min(
          1,
          0.9 * headBulbIntensity * intensityMul * headMatchK
        );
      }

      const tr = trailSpritesRef.current[si];
      if (tr) {
        const scale = headBulbSize * s.size * sizeMul * headMatchK;
        const desiredX = scale * (bulbWidthMul * 0.65);
        const clampedX = Math.min(desiredX, maxSpriteHalfX);
        const burstMul = s.burstActive ? 1.1 : 1.0;
        tr.position.set(s.x, s.headY - s.charStep * s.size * 0.6, s.z + 0.005);
        tr.scale.set(
          clampedX * burstMul,
          scale * (bulbHeightMul * trailLength) * burstMul,
          1
        );
        tr.material.opacity = Math.min(
          1,
          trailOpacity * intensityMul * 0.9 * headMatchK
        );
      }
    }
  });

  return (
    <group>
      {/* sprites */}
      {data.map((s, si) => (
        <group key={`sprgrp-${si}`}>
          <sprite
            ref={(r) => r && (glowSpritesRef.current[si] = r)}
            material={spriteMat}
            position={[s.x, s.headY, s.z + 0.01]}
          />
          <sprite
            ref={(r) => r && (trailSpritesRef.current[si] = r)}
            material={trailMat}
            position={[s.x, s.headY - s.charStep * s.size * 0.6, s.z + 0.005]}
          />
        </group>
      ))}

      {/* glyphs – stable keys; NO children! */}
      {data.map((s, si) =>
        Array.from({ length: s.tailLen }).map((_, gi) => {
          const idx = baseIndex[si] + gi;
          return (
            <Text
              key={`s${si}-g${gi}`}
              ref={(r) => r && (refs.current[idx] = r)}
              position={[s.x, s.headY + gi * s.charStep * s.size, s.z]}
              fontSize={s.size}
              characters={GLYPHS}
              letterSpacing={0.3}
              anchorX="center"
              anchorY="middle"
              depthOffset={-1}
              color={baseColor}
              outlineColor={baseColor}
              material-transparent
              material-toneMapped={false}
              material-blending={THREE.AdditiveBlending}
              material-depthWrite={false}
              frustumCulled={false}
            />
          );
        })
      )}
    </group>
  );
}

function DigitalSparks({
  count = 1800,
  radius = 2,
  speed = 0.06,
  color = "#5DFFD9",
  brightness = 1,
  // NEW:
  area = null, // { x, yTop, yBottom, zNear, zFar }
  fillFrustum = true, // seed in view on first paint
  prewarm = 0, // optional seconds of simulated time
}) {
  const geom = useMemo(() => new THREE.BufferGeometry(), []);
  const positions = useMemo(() => new Float32Array(count * 3), [count]);
  const velocities = useMemo(() => new Float32Array(count), [count]);
  const pointsRef = useRef();

  useLayoutEffect(() => {
    const useFrustum = fillFrustum && area;
    for (let i = 0; i < count; i++) {
      if (useFrustum) {
        // Seed INSIDE the current camera frustum
        const x = THREE.MathUtils.lerp(-area.x, area.x, Math.random());
        const y = THREE.MathUtils.lerp(area.yBottom, area.yTop, Math.random());
        const z = THREE.MathUtils.lerp(area.zFar, area.zNear, Math.random());
        positions.set([x, y, z], i * 3);
      } else {
        // Original spherical cone seed (kept as fallback)
        const phi = Math.random() * Math.PI * 2;
        const costheta = Math.random() * 2 - 1;
        const u = Math.random();
        const theta = Math.acos(costheta);
        const r = radius * Math.cbrt(u);
        const x = r * Math.sin(theta) * Math.cos(phi);
        const y = r * Math.sin(theta) * Math.sin(phi);
        const z = -Math.abs(r);
        positions.set([x, y, z], i * 3);
      }
      velocities[i] = Math.random() * 0.6 + 0.4;
    }

    if (prewarm > 0) {
      const frames = Math.floor(prewarm * 60);
      const stepPerFrame = speed * 0.01; // matches useFrame logic
      for (let i = 0; i < count; i++) {
        const idxZ = i * 3 + 2;
        let z = positions[idxZ];
        for (let k = 0; k < frames; k++) {
          z += stepPerFrame * velocities[i];
          const wrapNear = area ? area.zNear : 1;
          if (z > wrapNear) {
            const far = area ? area.zFar : -radius;
            const span = area
              ? Math.abs(area.zNear - area.zFar) * 0.5
              : radius * 0.5;
            z = far - Math.random() * span;
          }
        }
        positions[idxZ] = z;
      }
    }

    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  }, [
    geom,
    positions,
    velocities,
    count,
    radius,
    area,
    fillFrustum,
    prewarm,
    speed,
  ]);

  const mat = useMemo(
    () =>
      new THREE.PointsMaterial({
        color,
        size: 0.06,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.55 * brightness,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    [color, brightness]
  );

  useFrame((_, dt) => {
    const posAttr = geom.attributes?.position;
    if (!posAttr) return;
    const arr = posAttr.array;
    const step = speed * (dt * 60) * 0.01;

    for (let i = 0; i < count; i++) {
      const zi = i * 3 + 2;
      arr[zi] += step * velocities[i];

      // Wrap using frustum bounds when available
      const wrapNear = area ? area.zNear : 1;
      if (arr[zi] > wrapNear) {
        const far = area ? area.zFar : -radius;
        const span = area
          ? Math.abs(area.zNear - area.zFar) * 0.5
          : radius * 0.5;
        arr[zi] = far - Math.random() * span;
      }
    }
    posAttr.needsUpdate = true;

    if (pointsRef.current) {
      const t = performance.now() * 0.001;
      pointsRef.current.material.opacity =
        0.45 * brightness + Math.sin(t * 0.8) * 0.15 * brightness;
    }
  });

  return <points ref={pointsRef} geometry={geom} material={mat} />;
}

function CameraLooper({
  startZ = 2, // where the camera begins
  endZ = -1.4, // how far “forward” it travels (more negative = deeper)
  forwardSeconds = 4.5, // travel time before snapping back
  onSnap, // called exactly when we snap back
}) {
  const tRef = React.useRef(0);

  useFrame((state, dt) => {
    const cam = state.camera;
    const now = state.clock.getElapsedTime();

    // progress 0→1 over forwardSeconds
    const t = tRef.current + dt;
    const p = Math.min(1, t / Math.max(0.001, forwardSeconds));

    // keep your gentle sway so it still feels alive
    const swayX = Math.sin(now * 0.07) * 0.35;
    const swayY = Math.sin(now * 0.05) * 0.22;

    cam.position.set(swayX, swayY, THREE.MathUtils.lerp(startZ, endZ, p));
    cam.lookAt(0, 0, -12);

    if (p >= 1) {
      // trigger glitch FIRST, then snap z back this same frame
      onSnap && onSnap();
      cam.position.z = startZ; // hard snap
      cam.updateMatrixWorld();
      tRef.current = 0; // restart forward run
    } else {
      tRef.current = t;
    }
  });

  return null;
}

// ---------- scene ----------
function Scene({ density = 1.2, speed = 1.2, glow = 0.6 }) {
  const streamCount = Math.round(90 * density);
  const sparkCount = Math.round(1400 * density);
  const speedFactor = 0.95 + (speed - 1) * 0.8;
  const brightness = 0.85 + glow * 0.45;

  const area = useFrustumArea({ zNear: -6, zFar: -28, overhang: 0.12 });
  const fog = useMemo(
    () => new THREE.FogExp2(new THREE.Color("#110716"), 0.038),
    []
  );

  const glitchRef = React.useRef(null);
  const { invalidate } = useThree();

  const fireGlitch = React.useCallback(
    (ms = 550) => {
      const g = glitchRef.current;
      if (!g) return;

      // Make it obvious and immediate
      g.mode = GlitchMode.CONSTANT_WILD;
      g.goWild = true;
      g.delay = [0, 0];
      g.duration = [ms / 1000, ms / 1000];
      if (typeof g.trigger === "function") g.trigger();

      invalidate();

      setTimeout(() => {
        // back to “off” state (no random glitches)
        const g2 = glitchRef.current;
        if (!g2) return;
        g2.goWild = false;
        g2.mode = GlitchMode.SPORADIC;
        g2.delay = [9999, 9999]; // effectively disables random hits
        invalidate();
      }, ms);
    },
    [invalidate]
  );

  return (
    <>
      <color attach="background" args={["#000"]} />
      <primitive attach="fog" object={fog} />
      <ambientLight intensity={0.2 * brightness} />
      <directionalLight
        position={[2, 4, 1]}
        intensity={0.3 * brightness}
        color={new THREE.Color("#B25AFF").lerp(new THREE.Color("#ffffff"), 0.2)}
      />

      <CameraLooper
        startZ={2}
        endZ={-1.4}
        forwardSeconds={6}
        onSnap={() => {
          setTimeout(() => fireGlitch(520), 0);
        }}
      />

      <group>
        <DigitalSparks
          count={sparkCount}
          speed={0.06 * speedFactor}
          brightness={brightness}
          area={area}
          fillFrustum
          prewarm={0.5}
          color="#B25AFF"
        />

        <DigitalSparks
          count={Math.round(900 * (density ?? 1))}
          speed={0.03 * speedFactor}
          brightness={0.55 * (0.85 + glow * 0.45)}
          area={area}
          fillFrustum
          prewarm={0.5}
          color="#DCE7FF"
        />

        <MatrixStreams
          streams={streamCount}
          speedFactor={speedFactor}
          area={area}
          baseColor="#B25AFF"
          flickersPerSecond={10}
          changesPerFlicker={3}
          sparkleAvgLength={7}
          sparkleSpeed={34}
          sparkleAlphaBoost={0.3}
          sparkleRunsPerSecond={1.2}
          endGlowBoost={0.18}
          endAlphaBoost={0.18}
          endGlowSpan={5}
          headBulbSize={0.95}
          headBulbIntensity={1.5}
          bodyBaseLightness={0.64}
          alphaFalloff={0.024}
          bodyLightnessLift={0.08}
          bodyAlphaLift={0.08}
          // lanes + clamping
          minSize={0.75}
          maxSize={1.1}
          glyphWidthMul={0.9}
          letterSpacingFactor={1.05}
          lanePadding={3}
          laneJitter={0.03}
          // CodeBurst
          burstChancePerSecond={0.06}
          burstExtraGlow={0.35}
          burstSpeedBoost={1.75}
          // Ripple
          ripplePeriod={7.5}
          rippleHeight={1.8}
          rippleStrength={0.25}
          // halo softness
          tailHaloWidth={0.06}
          tailHaloBlur={0.15}
        />
      </group>

      {/* Post-processing: tasteful bloom + tiny chroma/film & vignette */}
      <EffectComposer multisampling={0}>
        <Bloom
          mipmapBlur
          intensity={0.34}
          luminanceThreshold={0.25}
          luminanceSmoothing={0.9}
        />
        <ChromaticAberration offset={[0.00035, 0.00035]} />
        <Noise
          premultiply
          opacity={0.06}
          blendFunction={BlendFunction.SOFT_LIGHT}
        />
        <Vignette eskil={false} offset={0.24} darkness={0.68} />

        {/* CRT-style scanlines (super subtle) */}
        <Scanline
          blendFunction={BlendFunction.MULTIPLY}
          density={1.1} // higher = denser lines
        />

        <Glitch
          ref={glitchRef}
          active
          enabled
          strength={[0.15, 0.35]}
          columns={0.05}
          ratio={1}
          chromaticAberrationOffset={[0.006, 0.006]}
          mode={GlitchMode.SPORADIC}
          delay={[9999, 9999]} // disable ambient randomness
          duration={[0.5, 0.5]}
        />

        <DepthOfField
          focusDistance={0.015}
          focalLength={0.015}
          bokehScale={1.2}
        />
      </EffectComposer>
    </>
  );
}
