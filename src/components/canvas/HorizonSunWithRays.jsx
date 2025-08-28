// src/components/canvas/HorizonSunWithRays.jsx
import * as THREE from "three";
import React, { forwardRef } from "react";
import { GodRays } from "@react-three/postprocessing";

/**
 * HorizonSun
 * - ForwardRef goes on the core sphere (pass its Object3D to <SunRays />).
 * - Depth test ON so the neon grid can occlude the sun (sunset look).
 * - Uses additive blending for neon-style glow.
 */
export const HorizonSun = forwardRef(function HorizonSun(
  {
    position = [0, -15, -60],
    radius = 3.3,

    // colors / opacities
    coreColor = "#ff66cc",   // pink core
    haloColor = "#ff9a3c",   // warm orange ring
    auraColor = "#ffb167",   // wide faint disc

    sunOpacity = 0.42,
    haloOpacity = 0.10,
    auraOpacity = 0.05,

    // geometry scales
    ringInnerScale = 1.06,
    ringOuterScale = 1.45,
    showAura = true,
    additive = true,         // switch to false if you ever want normal blending
  },
  ref
) {
  const blend = additive ? THREE.AdditiveBlending : THREE.NormalBlending;

  return (
    <>
      {/* Core */}
      <mesh ref={ref} position={position}>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshBasicMaterial
          color={coreColor}
          transparent
          opacity={sunOpacity}
          toneMapped={false}
          blending={blend}
          depthWrite={false}
          depthTest={true}
        />
      </mesh>

      {/* Halo ring */}
      <mesh position={position}>
        <ringGeometry args={[radius * ringInnerScale, radius * ringOuterScale, 96]} />
        <meshBasicMaterial
          color={haloColor}
          transparent
          opacity={haloOpacity}
          side={THREE.DoubleSide}
          toneMapped={false}
          blending={blend}
          depthWrite={false}
          depthTest={true}
        />
      </mesh>

      {/* Wide faint aura (very subtle) */}
      {showAura && (
        <mesh position={position}>
          <circleGeometry args={[radius * 2.2, 96]} />
          <meshBasicMaterial
            color={auraColor}
            transparent
            opacity={auraOpacity}
            side={THREE.DoubleSide}
            toneMapped={false}
            blending={blend}
            depthWrite={false}
            depthTest={true}
          />
        </mesh>
      )}
    </>
  );
});

/**
 * SunRays
 * - Guarded so it only renders when a valid Object3D is provided.
 * - Mount this INSIDE your existing <EffectComposer>.
 * - Defaults are the "toned down" preset.
 */
export function SunRays({
  sun,              // pass the Object3D, e.g. sunObj
  enabled = true,
  samples = 48,
  density = 0.85,
  decay = 0.92,
  weight = 0.45,
  exposure = 0.26,
  clampMax = 0.7,
  blur = true,
}) {
  if (!enabled || !sun) return null;
  return (
    <GodRays
      sun={sun}
      samples={samples}
      density={density}
      decay={decay}
      weight={weight}
      exposure={exposure}
      clampMax={clampMax}
      blur={blur}
    />
  );
}

