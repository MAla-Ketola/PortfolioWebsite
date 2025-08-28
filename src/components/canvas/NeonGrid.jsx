// src/components/canvas/NeonGrid.jsx
import * as THREE from "three";
import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshReflectorMaterial } from "@react-three/drei";

/**
 * Neon grid with a colored-chrome reflective floor.
 * Tip: keep Environment subtle (e.g., <Environment preset="night" intensity={0.3}/>),
 * or remove it for a pure neon look without grey sky tints.
 */
export default function NeonGrid({
  size = 260,        // grid width/height
  divisions = 90,    // squares per side
  y = -4.6,          // floor height
  tilt = -0.3,       // tilt toward camera
  speed = 2.6,       // neon pulse speed
  strength = 1.1,    // neon pulse strength
  baseHue = 0.92,    // magenta-ish hue [0..1]
  floorColor = "#2a0030", // deep magenta chrome base (prevents grey)
}) {
  const helperRef = useRef();
  const matRef = useRef();

  // Configure the neon grid line material
  useEffect(() => {
    const mat = helperRef.current.material;
    matRef.current = mat;
    mat.transparent = true;
    mat.toneMapped = false;              // keep lines bright
    mat.depthWrite = true;
    mat.depthTest = true;
    mat.blending = THREE.AdditiveBlending;
    helperRef.current.renderOrder = 2;
    helperRef.current.position.y = 0.003; // avoid z-fighting with floor
    mat.color.setHSL(baseHue, 1, 0.55);
    mat.opacity = 0.8;
  }, [baseHue]);

  // Animate the neon pulse
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const m = matRef.current;
    if (!m) return;

    const p = 0.5 + 0.5 * Math.sin(t * speed); // 0..1
    m.opacity = 0.35 + 0.6 * p * strength;
    m.color.setHSL(baseHue + 0.02 * Math.sin(t * 0.7), 1, 0.45 + 0.35 * p);
  });

  return (
    <group position={[0, y, 0]} rotation={[tilt, 0, 0]}>
      {/* Colored-chrome reflective floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]}>
        <planeGeometry args={[size, size]} />
        <MeshReflectorMaterial
          // chrome feel
          metalness={1}
          roughness={0.04}        // lower = sharper mirror
          mirror={1}
          // reflection quality
          resolution={1024}
          blur={[160, 70]}        // glossy blur
          mixBlur={1}
          mixStrength={3}         // reflection intensity
          // avoid neutral grey from IBL
          color={floorColor}      // magenta base tint
          envMapIntensity={0.6}   // keep IBL subtle to preserve tint
          // artifact control
          minDepthThreshold={0.4}
          maxDepthThreshold={1.1}
          depthScale={0.6}
          reflectorOffset={0.02}
          dithering
        />
      </mesh>

      {/* Pulsing neon grid lines above the floor */}
      <gridHelper
        ref={helperRef}
        args={[size, divisions, "#ff00cc", "#ff00cc"]} // overridden by animated material
      />
    </group>
  );
}

