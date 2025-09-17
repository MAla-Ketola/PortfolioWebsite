// MatrixBG.jsx — 3D Matrix rain (lanes + sprite clamping + CodeBurst + ripple + postfx)
// Requires:
//   npm i @react-three/fiber @react-three/drei three
//   npm i @react-three/postprocessing postprocessing

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import {
  EffectComposer,
  Bloom,
  Noise,
  Vignette,
  ChromaticAberration,
} from "@react-three/postprocessing";

// ---------- utils ----------
const GLYPHS =
  "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(
    ""
  );
const rnd = (min, max) => Math.random() * (max - min) + min;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth01 = (t) => t * t * (3 - 2 * t);

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

// ---------- round glow texture ----------
function makeRadialGlowTexture(size = 256) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
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
  return tex;
}

// ---------- public wrapper ----------
export default function MatrixBG({
  density = 1.2,
  speed = 1.2,
  glow = 0.6,
  opacity = 1,
  className = "absolute inset-0 -z-10 pointer-events-none",
}) {
  return (
    <div className={className} style={{ opacity }}>
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 2], fov: 60, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Scene density={density} speed={speed} glow={glow} />
      </Canvas>
    </div>
  );
}

// ---------- the rain ----------
export function MatrixStreams({
  streams = 80,
  area = { x: 14, yTop: 9, yBottom: -9, zNear: -6, zFar: -28 },
  speedFactor = 1,
  baseColor = "#33d299",

  // flicker + sparkle behaviour
  flickersPerSecond = 10,
  changesPerFlicker = 3,
  sparkleRunsPerSecond = 0.8,
  sparkleAvgLength = 5,
  sparkleSpeed = 28,
  sparkleGlowBoost = 0.22,
  sparkleAlphaBoost = 0.20,

  // head/tail brightness shaping
  endGlowBoost = 0.35,
  endAlphaBoost = 0.35,
  endGlowSpan = 3,

  // halo around bright tail part (softened a touch)
  tailHaloWidth = 0.08,
  tailHaloBlur = 0.5,

  // overall body brightness
  headBaseLightness = 0.70,
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
  lanePadding = 1.20,
  laneJitter = 0.08,

  // === CodeBurst controls (cinematic column eruptions) ===
  burstChancePerSecond = 0.035,
  burstExtraGlow = 0.35,
  burstSpeedBoost = 1.75,

  // === Compression ripple controls ===
  ripplePeriod = 7.5,      // seconds per full down-sweep
  rippleHeight = 1.8,      // band thickness
  rippleStrength = 0.25,   // how much we compress spacing inside band
}) {
  // 1) stable sizes for real widest glyph
  const sizes = useMemo(() => {
    const arr = Array.from({ length: streams }, () => rnd(minSize, maxSize));
    return arr;
  }, [streams, minSize, maxSize]);

  // 2) lane geometry
  const totalWidth = area.x * 2;
  const widestGlyphHalf = (maxSize * glyphWidthMul * letterSpacingFactor) * 0.5;
  const laneMinWidth = widestGlyphHalf * 2 * lanePadding;
  const laneCountCap = Math.max(1, Math.floor(totalWidth / laneMinWidth));
  const usedStreams = Math.min(streams, laneCountCap);

  const lanes = useMemo(() => {
    const arr = [];
    if (usedStreams === 1) arr.push(0);
    else {
      for (let i = 0; i < usedStreams; i++) {
        const t = (i + 0.5) / usedStreams;
        arr.push(-area.x + t * totalWidth);
      }
    }
    return arr;
  }, [usedStreams, area.x, totalWidth]);

  // 3) per-stream state (snapped to lanes)
  const data = useMemo(() => {
    const arr = [];
    for (let i = 0; i < usedStreams; i++) {
      const size = sizes[i];
      const laneCenter = lanes[i];

      const safeHalf = laneMinWidth * 0.5 - widestGlyphHalf;
      const jitter = Math.min(safeHalf * laneJitter, 0.25);
      const x = laneCenter + (jitter > 0 ? rnd(-jitter, jitter) : 0);

      const tailLen = Math.floor(rnd(12, 24));
      arr.push({
        x,
        laneCenter,
        size,
        z: rnd(area.zFar, area.zNear),
        headY: rnd(area.yBottom, area.yTop),
        fall: rnd(2.2, 4.2) * speedFactor,
        baseOpacity: rnd(0.4, 0.7),
        hueJitter: rnd(-12, 18),
        tailLen,
        chars: Array.from({ length: tailLen }, () =>
          GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
        ),
        distAccum: 0,
        charStep: 1.05,

        // sparkle
        sparkActive: false,
        sparkStart: 2,
        sparkLen: 5,
        sparkProg: 0,
        sparkLastStep: -1,

        // CodeBurst
        burstActive: false,
        burstT: 0,
        burstDur: rnd(0.5, 0.8),
        burstSpeedMul: 1.0,
      });
    }
    return arr;
  }, [
    usedStreams,
    sizes,
    lanes,
    area,
    speedFactor,
    laneMinWidth,
    widestGlyphHalf,
    laneJitter,
  ]);

  // flattened index for refs
  const baseIndex = useMemo(() => {
    const idx = [];
    let acc = 0;
    for (let i = 0; i < data.length; i++) {
      idx.push(acc);
      acc += data[i].tailLen;
    }
    return idx;
  }, [data]);

  // refs
  const refs = useRef([]); refs.current = [];
  const glowSpritesRef = useRef([]); glowSpritesRef.current = [];
  const trailSpritesRef = useRef([]); trailSpritesRef.current = [];

  const spriteMat = useMemo(() => {
    const tex = makeRadialGlowTexture(256);
    return new THREE.SpriteMaterial({
      map: tex,
      color: new THREE.Color(baseColor),
      transparent: true,
      opacity: 0.9 * headBulbIntensity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      alphaTest: 0.01,
    });
  }, [baseColor, headBulbIntensity]);

  const trailMat = useMemo(() => {
    const tex = makeRadialGlowTexture(256);
    return new THREE.SpriteMaterial({
      map: tex,
      color: new THREE.Color(baseColor),
      transparent: true,
      opacity: trailOpacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      alphaTest: 0.01,
    });
  }, [baseColor, trailOpacity]);

  // ---------- animation ----------
  useFrame((state, dt) => {
    const t = state.clock.getElapsedTime();

    // compression wave Y (top -> bottom)
    const sweepSpan = area.yTop - area.yBottom + rippleHeight;
    const waveY =
      area.yTop - ((t % ripplePeriod) / ripplePeriod) * sweepSpan;

    for (let si = 0; si < data.length; si++) {
      const s = data[si];

      // CodeBurst start/advance
      if (!s.burstActive && Math.random() < burstChancePerSecond * dt) {
        s.burstActive = true;
        s.burstT = 0;
        s.burstDur = rnd(0.5, 0.8);
        s.burstSpeedMul = burstSpeedBoost;
      }
      if (s.burstActive) {
        s.burstT += dt;
        if (s.burstT >= s.burstDur) {
          s.burstActive = false;
          s.burstSpeedMul = 1.0;
        }
      }

      // fall (faster during burst)
      const fallNow = s.fall * (s.burstActive ? s.burstSpeedMul : 1.0);
      s.headY -= fallNow * dt;

      // shift tail by glyph height
      s.distAccum += fallNow * dt;
      const stepDist = s.charStep * s.size;
      while (s.distAccum >= stepDist) {
        s.distAccum -= stepDist;
        for (let gi = s.tailLen - 1; gi > 0; gi--) s.chars[gi] = s.chars[gi - 1];

        // new head
        let next = s.chars[0];
        for (let tries = 0; tries < 3 && next === s.chars[1]; tries++) {
          next = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
        s.chars[0] = next;
      }

      // background flickers (non-head)
      if (Math.random() < Math.min(0.95, flickersPerSecond * dt)) {
        const n = Math.max(1, Math.min(changesPerFlicker, s.tailLen - 1));
        for (let k = 0; k < n; k++) {
          const j = 1 + Math.floor(Math.random() * (s.tailLen - 1));
          let next = s.chars[j];
          for (let tries = 0; tries < 3 && next === s.chars[j]; tries++) {
            next = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          }
          s.chars[j] = next;
        }
      }

      // sparkle run
      if (!s.sparkActive && Math.random() < sparkleRunsPerSecond * dt) {
        s.sparkActive = true;
        s.sparkStart = Math.min(s.tailLen - 2, 1 + Math.floor(Math.random() * 3));
        s.sparkLen = Math.max(3, Math.min(7, Math.round(rnd(sparkleAvgLength - 1, sparkleAvgLength + 2))));
        s.sparkProg = 0;
        s.sparkLastStep = -1;
      }
      if (s.sparkActive) {
        s.sparkProg += sparkleSpeed * dt;
        const stepNow = Math.floor(s.sparkProg);
        if (stepNow !== s.sparkLastStep) {
          const j = s.sparkStart + stepNow;
          if (j > 0 && j < s.tailLen) {
            let next = s.chars[j];
            for (let tries = 0; tries < 3 && next === s.chars[j]; tries++) {
              next = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
            }
            s.chars[j] = next;
          }
          s.sparkLastStep = stepNow;
        }
        if (s.sparkProg >= s.sparkLen) s.sparkActive = false;
      }

      // recycle (snap to its lane again; never leaves)
      if (s.headY < area.yBottom - 2) {
        s.headY = area.yTop + s.tailLen * s.size * rnd(0.2, 1.0);
        s.z = rnd(area.zFar, area.zNear);
        s.distAccum = 0;

        const safeHalf = laneMinWidth * 0.5 - widestGlyphHalf;
        const jitter = Math.min(safeHalf * laneJitter, 0.25);
        s.x = s.laneCenter + (jitter > 0 ? rnd(-jitter, jitter) : 0);

        for (let gi = 0; gi < s.tailLen; gi++) {
          if (Math.random() < 0.8) s.chars[gi] = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
        s.sparkActive = false;
        s.burstActive = false;
        s.burstSpeedMul = 1.0;
      }

      // depth factor
      const zN = area.zNear, zF = area.zFar;
      const depthT = clamp01((s.z - zN) / (zF - zN));
      const d = smooth01(depthT);

      // draw glyphs (+ ripple compression)
      const hueBase = 120 + s.hueJitter + Math.sin((t + si) * 0.1) * 6;
      for (let gi = 0; gi < s.tailLen; gi++) {
        const idx = baseIndex[si] + gi;
        const m = refs.current[idx];
        if (!m) continue;

        // compression ripple: local step multiplier where band passes
        const posYRaw = s.headY + gi * s.charStep * s.size;
        const dy = Math.abs(posYRaw - waveY);
        const inWave = dy < rippleHeight * 0.5;
        const localStepMul = inWave ? (1 - rippleStrength) : 1;
        const posY = s.headY + gi * (s.charStep * localStepMul) * s.size;

        m.position.set(s.x, posY, s.z);

        const isHead = gi === 0;
        const sparkFront = s.sparkActive ? s.sparkStart + s.sparkProg : -999;
        const isSparked = s.sparkActive && gi >= s.sparkStart && gi <= Math.min(s.tailLen - 1, Math.floor(sparkFront));

        let lightness = isHead ? headBaseLightness : bodyBaseLightness;
        let alpha = isHead
          ? Math.min(1.0, s.baseOpacity + 0.35)
          : Math.max(0.10, s.baseOpacity - gi * alphaFalloff);

        if (gi <= endGlowSpan) {
          const giForBoost = Math.max(1, gi);
          const k = 1 - giForBoost / Math.max(1, endGlowSpan);
          const depthFade = lerp(1.0, 0.75, d);
          lightness = Math.min(0.99, lightness + endGlowBoost * k * depthFade);
          alpha = Math.min(1.0, alpha + endAlphaBoost * k * depthFade);
        }

        if (gi > endGlowSpan) {
          const depthFade = lerp(1.0, 0.85, d);
          const downTail = 1 - (gi / s.tailLen) * 0.6;
          lightness = Math.min(0.9, lightness + bodyLightnessLift * depthFade * downTail);
          alpha     = Math.min(0.9, alpha     + bodyAlphaLift     * depthFade * downTail);
        }

        if (isSparked) {
          lightness = Math.min(0.99, lightness + sparkleGlowBoost * 0.6);
          alpha = Math.min(1.0, alpha + sparkleAlphaBoost * 0.6);
        }

        // burst visual boost (strongest at start of burst)
        if (s.burstActive) {
          const k = 1 - Math.min(1, s.burstT / s.burstDur);
          lightness = Math.min(0.99, lightness + burstExtraGlow * (0.6 + 0.4 * k));
          alpha = Math.min(1.0, alpha + burstExtraGlow * (0.5 + 0.5 * k));
        }

        const hue = isHead ? hueBase : hueBase - (isSparked ? 2 : 6);
        if (m.color?.setHSL) m.color.setHSL(hue / 360, 1, lightness);
        if (m.material && "opacity" in m.material) m.material.opacity = alpha;

        m.text = s.chars[gi];
        if (m.sync) m.sync();

        // halo (soft)
        const giForHalo = Math.max(1, gi);
        const haloK = gi <= endGlowSpan ? 1 - giForHalo / Math.max(1, endGlowSpan) : 0;
        if ("outlineWidth" in m) m.outlineWidth = tailHaloWidth * haloK;
        if ("outlineBlur" in m) m.outlineBlur = haloK > 0 ? tailHaloBlur : 0;
        if ("outlineColor" in m) m.outlineColor = baseColor;
      }

      // ---------- SPRITE CLAMPING (keep sprites inside lane) ----------
      const sizeMul = lerp(bulbSizeNear, bulbSizeFar, d);
      const intensityMul = lerp(bulbIntensityNear, bulbIntensityFar, d);
      const pulse = 1 + Math.sin((t * 5.5 + si * 0.7)) * 0.08;
      const headMatchK = 1 - 1 / Math.max(1, endGlowSpan);

      const laneHalf = laneMinWidth * 0.5;
      const maxSpriteHalfX = Math.max(0.05, laneHalf - widestGlyphHalf);

      const spr = glowSpritesRef.current[si];
      if (spr) {
        const scale = headBulbSize * s.size * sizeMul * pulse * headMatchK;
        const desiredX = scale * bulbWidthMul;
        const clampedX = Math.min(desiredX, maxSpriteHalfX);
        const burstMul = s.burstActive ? 1.15 : 1.0; // burst juicer
        spr.position.set(s.x, s.headY, s.z + 0.01);
        spr.scale.set(clampedX * burstMul, (scale * bulbHeightMul) * burstMul, 1);
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
        const burstMul = s.burstActive ? 1.1 : 1.0; // burst juicer
        tr.position.set(s.x, s.headY - s.charStep * s.size * 0.6, s.z + 0.005);
        tr.scale.set(clampedX * burstMul, (scale * (bulbHeightMul * trailLength)) * burstMul, 1);
        tr.material.opacity = Math.min(1, trailOpacity * intensityMul * 0.9 * headMatchK);
      }
      // ---------- /SPRITE CLAMPING ----------
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

      {/* glyphs */}
      {data.map((s, si) =>
        Array.from({ length: s.tailLen }).map((_, gi) => {
          const idx = baseIndex[si] + gi;
          return (
            <Text
              key={idx}
              ref={(r) => r && (refs.current[idx] = r)}
              position={[s.x, s.headY + gi * s.charStep * s.size, s.z]}
              fontSize={s.size}
              characters={GLYPHS}
              letterSpacing={0.02}
              anchorX="center"
              anchorY="middle"
              depthOffset={-1}
              color={baseColor}
              outlineColor={baseColor}
              outlineWidth={gi <= endGlowSpan ? tailHaloWidth : 0}
              outlineBlur={gi <= endGlowSpan ? tailHaloBlur : 0}
              material-transparent
              material-toneMapped={false}
              material-blending={THREE.AdditiveBlending}
              material-depthWrite={false}
            >
              {s.chars[gi]}
            </Text>
          );
        })
      )}
    </group>
  );
}

// ---------- particles ----------
function DigitalSparks({
  count = 1800,
  radius = 26,
  speed = 0.06,
  color = "#33d299",
  brightness = 1,
}) {
  const geom = React.useMemo(() => new THREE.BufferGeometry(), []);
  const positions = React.useMemo(() => new Float32Array(count * 3), [count]);
  const velocities = React.useMemo(() => new Float32Array(count), [count]);
  const pointsRef = React.useRef();

  React.useLayoutEffect(() => {
    for (let i = 0; i < count; i++) {
      const phi = Math.random() * Math.PI * 2;
      const costheta = Math.random() * 2 - 1;
      const u = Math.random();
      const theta = Math.acos(costheta);
      const r = radius * Math.cbrt(u);

      const x = r * Math.sin(theta) * Math.cos(phi);
      const y = r * Math.sin(theta) * Math.sin(phi);
      const z = -Math.abs(r);

      positions.set([x, y, z], i * 3);
      velocities[i] = Math.random() * 0.6 + 0.4;
    }

    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return () => {};
  }, [geom, positions, velocities, count, radius]);

  const mat = React.useMemo(
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
    for (let i = 0; i < count; i++) {
      const idx = i * 3 + 2;
      arr[idx] += speed * velocities[i] * (dt * 60) * 0.01;
      if (arr[idx] > 1) {
        arr[idx] = -radius - Math.random() * (radius * 0.5);
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

// ---------- background grids ----------
function WireframeGrids({
  size = 40,
  divisions = 40,
  pulsePeriod = 12,
  tilt = -0.35,
  color = "#0bbf7a",
  brightness = 1,
}) {
  const g1 = React.useRef();
  const g2 = React.useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const phase = (Math.sin((t / pulsePeriod) * Math.PI * 2) + 1) / 2;
    const phase2 = (Math.sin(((t + pulsePeriod * 0.33) / pulsePeriod) * Math.PI * 2) + 1) / 2;
    const o1 = (0.02 + phase * 0.12) * brightness;
    const o2 = (0.02 + phase2 * 0.08) * brightness;
    if (g1.current) { g1.current.material.opacity = o1; g1.current.rotation.x = tilt; }
    if (g2.current) { g2.current.material.opacity = o2; g2.current.rotation.x = tilt; }
  });

  const gridMat = React.useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color,
        wireframe: true,
        transparent: true,
        opacity: 0.08 * brightness,
        depthWrite: false,
      }),
    [color, brightness]
  );

  return (
    <group>
      <mesh ref={g1} position={[0, -2.2, -9]} material={gridMat}>
        <planeGeometry args={[size, size, divisions, divisions]} />
      </mesh>
      <mesh ref={g2} position={[0, -3.5, -18]} material={gridMat}>
        <planeGeometry args={[size * 1.6, size * 1.6, divisions, divisions]} />
      </mesh>
    </group>
  );
}

// ---------- scene ----------
function Scene({ density = 1.2, speed = 1.2, glow = 0.6 }) {
  const streamCount = Math.round(75 * density);
  const sparkCount = Math.round(1600 * density);
  const speedFactor = 0.85 + (speed - 1) * 0.8;
  const brightness = 0.85 + glow * 0.45;

  const area = useFrustumArea({ zNear: -6, zFar: -28, overhang: 0.12 });
  const fog = React.useMemo(() => new THREE.FogExp2(new THREE.Color("#021a12"), 0.055), []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const cam = state.camera;
    cam.position.x = Math.sin(t * 0.07) * 0.35;
    cam.position.y = Math.sin(t * 0.05) * 0.22;
    cam.lookAt(0, 0, -12);
  });

  return (
    <>
      <color attach="background" args={["#000"]} />
      <primitive attach="fog" object={fog} />
      <ambientLight intensity={0.2 * brightness} />
      <directionalLight position={[2, 4, 1]} intensity={0.3 * brightness} color={"#16ff97"} />

      <group>
        <DigitalSparks count={sparkCount} speed={0.06 * speedFactor} brightness={brightness} />
        <WireframeGrids brightness={brightness} />
        <MatrixStreams
          streams={streamCount}
          speedFactor={speedFactor}
          area={area}
          baseColor="#16ff97"
          flickersPerSecond={10}
          changesPerFlicker={3}
          sparkleAvgLength={7}
          sparkleSpeed={34}
          sparkleAlphaBoost={0.3}
          sparkleRunsPerSecond={1.2}
          endGlowBoost={0.4}
          endAlphaBoost={0.4}
          endGlowSpan={3}
          headBulbSize={0.85}
          headBulbIntensity={1}
          bodyBaseLightness={0.54}
          alphaFalloff={0.024}
          bodyLightnessLift={0.08}
          bodyAlphaLift={0.08}
          // lanes + clamping
          minSize={0.75}
          maxSize={1.1}
          glyphWidthMul={0.9}
          letterSpacingFactor={1.05}
          lanePadding={1.20}
          laneJitter={0.08}
          // CodeBurst
          burstChancePerSecond={0.06}
          burstExtraGlow={0.35}
          burstSpeedBoost={1.75}
          // Ripple
          ripplePeriod={7.5}
          rippleHeight={1.8}
          rippleStrength={0.25}
          // halo softness
          tailHaloWidth={0.08}
          tailHaloBlur={0.5}
        />
      </group>

      {/* Post-processing: tasteful bloom + tiny chroma/film & vignette */}
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur intensity={0.35} luminanceThreshold={0.2} luminanceSmoothing={0.9} />
        <ChromaticAberration offset={[0.0006, 0.0004]} />
        <Noise premultiply opacity={0.08} />
        <Vignette eskil={false} offset={0.25} darkness={0.85} />
      </EffectComposer>
    </>
  );
}


