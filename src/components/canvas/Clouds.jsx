// src/components/canvas/Clouds.jsx
import React, { useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Retro Horizon Clouds
 * - Places a lane of sprite clouds near the sun on the horizon.
 * - Gentle left/right drift with wraparound and vertical bobbing.
 * - Uses cloud.png with alphaTest to avoid boxy edges.
 * - Auto-tints from sunColors (fallback to a peachy tint).
 * - Adds a subtle per-cloud hue wobble for a "breathing" vibe.
 */
export default function Clouds({
  textureUrl = "/cloud.png",   // e.g. "src/assets/cloud.png"
  count = 16,
  horizonZ = -60,              // match your sun's z
  bandZJitter = 6,             // +/-Z variance to avoid a perfectly flat line
  minY = -16,                  // near your sun Y
  maxY = -8,
  bandHalfWidth = 130,         // world-units left/right bounds; controls wrap
  scaleMin = 10,               // base width of sprites in world units
  scaleMax = 22,
  tint,                        // optional string color; if omitted we auto-pick
  opacity = 0.9,
  speedMin = 0.05,             // lateral drift speed range
  speedMax = 0.2,
  bobAmp = 0.35,               // vertical bob amplitude
  bobSpeedMin = 0.2,
  bobSpeedMax = 0.6,
  alphaCutoff = 0.28,          // kills dark PNG fringes
  sunColors,                   // { coreColor, haloColor, auraColor } (optional)
}) {
  // --- Texture setup ---
  const tex = useLoader(THREE.TextureLoader, textureUrl);
  if (tex) {
    // Keep the PNG's soft edges and correct color space
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = 8;
  }

  // --- Base/auto tint selection ---
  const baseColor = useMemo(() => {
    const c =
      tint ??
      sunColors?.auraColor ??
      sunColors?.haloColor ??
      "#ffd1a3"; // warm peach fallback
    return new THREE.Color(c);
  }, [tint, sunColors?.auraColor, sunColors?.haloColor]);

  // temp color reused in animation loop
  const tempColor = useMemo(() => new THREE.Color(), []);
  const groupRef = useRef();

  // --- Precompute cloud instances ---
  const clouds = useMemo(() => {
    const rnd = (a, b) => a + Math.random() * (b - a);
    return Array.from({ length: count }).map((_, i) => {
      const x = rnd(-bandHalfWidth, bandHalfWidth);
      const y = rnd(minY, maxY);
      const z = horizonZ + rnd(-bandZJitter, bandZJitter);

      const w = rnd(scaleMin, scaleMax);       // width
      const h = w * rnd(0.45, 0.7);            // squashed for horizon look

      const dir = Math.random() < 0.5 ? -1 : 1;
      const speed = rnd(speedMin, speedMax) * dir;

      const bobSpd = rnd(bobSpeedMin, bobSpeedMax) * (Math.random() < 0.5 ? -1 : 1);
      const bobOff = Math.random() * Math.PI * 2;

      return {
        id: i,
        pos: new THREE.Vector3(x, y, z),
        baseY: y,
        scale: new THREE.Vector2(w, h),
        speed,
        bobSpd,
        bobOff,
      };
    });
  }, [
    count,
    bandHalfWidth,
    minY,
    maxY,
    horizonZ,
    bandZJitter,
    scaleMin,
    scaleMax,
    speedMin,
    speedMax,
    bobSpeedMin,
    bobSpeedMax,
  ]);

  // --- Animate drift, bob, wrap, and hue wobble ---
  useFrame((state, dt) => {
    const g = groupRef.current;
    if (!g) return;

    const t = state.clock.elapsedTime;
    for (let i = 0; i < g.children.length; i++) {
      const s = g.children[i];
      const data = clouds[i];

      // Lateral drift
      data.pos.x += data.speed * dt;

      // Wraparound horizontally
      if (data.pos.x > bandHalfWidth + 5) data.pos.x = -bandHalfWidth - 5;
      if (data.pos.x < -bandHalfWidth - 5) data.pos.x = bandHalfWidth + 5;

      // Vertical bobbing
      const y = data.baseY + Math.sin(t * data.bobSpd + data.bobOff) * bobAmp;

      // Apply transforms
      s.position.set(data.pos.x, y, data.pos.z);

      // Hue wobble: small ±0.05 H shift per cloud, desynced by id
      const wobble = Math.sin(t * 0.3 + data.id) * 0.05;
      tempColor.copy(baseColor);
      const hsl = { h: 0, s: 0, l: 0 };
      tempColor.getHSL(hsl);
      hsl.h = (hsl.h + wobble + 1) % 1;
      tempColor.setHSL(hsl.h, hsl.s, hsl.l);

      // Apply color
      s.material.color.copy(tempColor);
    }
  });

  if (!tex) return null;

  return (
    <group ref={groupRef}>
      {clouds.map((c) => (
        <sprite key={c.id} position={c.pos.toArray()} scale={[c.scale.x, c.scale.y, 1]}>
          <spriteMaterial
            map={tex}
            // color is animated each frame; initial is fine to set
            color={baseColor}
            transparent
            opacity={opacity}
            depthWrite={false}  // avoid halos/glow artifacts
            depthTest={true}    // let the grid occlude clouds for "behind the grid" look
            alphaTest={alphaCutoff}
            toneMapped={false}
          />
        </sprite>
      ))}
    </group>
  );
}






