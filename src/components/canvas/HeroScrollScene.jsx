// src/components/canvas/HeroScrollScene.jsx
import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ScrollControls, Scroll, useScroll, Html } from "@react-three/drei";
import * as THREE from "three";

// Import your existing components
import NeonGrid from "./NeonGrid";
import {HorizonSun, SunRays } from "./HorizonSunWithRays";
import Clouds from "./Clouds";

function SceneContent() {
  // Refs to animate
  const camRef = useRef();
  const sunRef = useRef();
  const gridRef = useRef();
  const cloudsRef = useRef();

  // Scroll driver
  const scroll = useScroll();
  const snappedRef = useRef(false);

  // Colors shared between sun & clouds
  const sunColors = {
    coreColor: "#ff7a00",
    haloColor: "#ffb347",
    auraColor: "#ffd18f",
  };

  // Camera to control (attach it to the scene)
  useFrame(({ camera }, dt) => {
    // 0 -> 1 across the total scrollable area
    const s = scroll.offset;

    // --- Storyboard ---
    // 0.00–0.30: Dolly camera slightly forward & tilt down a hair
    // 0.30–0.60: Sun dips, grid begins to fade/tilt
    // 0.60–0.90: Grid fades out, clouds accelerate a touch
    // 0.90–1.00: Pause moment, marker visible; then user reaches next section

    // Camera base position/rotation
    const baseZ = 10;          // starting distance
    const targetZ = 6.2;       // closer at ~30%
    const camZ = THREE.MathUtils.lerp(baseZ, targetZ, THREE.MathUtils.smoothstep(s, 0.0, 0.3));
    camera.position.z = camZ;

    const baseTilt = -0.04;    // slight downward tilt (radians)
    const extraTilt = -0.12;   // add a bit more tilting by mid scroll
    const tiltAmt = THREE.MathUtils.lerp(baseTilt, baseTilt + extraTilt, THREE.MathUtils.smoothstep(s, 0.2, 0.6));
    camera.rotation.x = tiltAmt;

    // Sun dip (y from -20 -> -23)
    if (sunRef.current) {
      const baseY = -20;
      const dipY = -23;
      const sunY = THREE.MathUtils.lerp(baseY, dipY, THREE.MathUtils.smoothstep(s, 0.25, 0.7));
      sunRef.current.position.y = sunY;

      // Slight scale pulse as you approach the handoff
      const scalePulse = 1 + Math.sin(s * Math.PI) * 0.02;
      sunRef.current.scale.setScalar(scalePulse);
    }

    // Grid tilt + fade
    if (gridRef.current) {
      // tilt the grid further downward after 0.3
      gridRef.current.rotation.x = THREE.MathUtils.lerp(
        -Math.PI / 2.8,       // base tilt you likely have
        -Math.PI / 2.2,       // a bit flatter
        THREE.MathUtils.smoothstep(s, 0.3, 0.7)
      );

      // fade emissive/intensity (requires props on your grid material)
      // If your NeonGrid exposes `setIntensity` or material uniforms, tweak here.
      // As a simple fallback: lower opacity on a group or material if available:
      gridRef.current.traverse((obj) => {
        if (obj.material && "opacity" in obj.material) {
          obj.material.transparent = true;
          obj.material.opacity = THREE.MathUtils.lerp(1, 0.2, THREE.MathUtils.smoothstep(s, 0.5, 0.85));
        }
      });
    }

    // Clouds: speed up subtly after 0.6
    if (cloudsRef.current && "userData" in cloudsRef.current) {
      cloudsRef.current.userData.speedBoost = THREE.MathUtils.lerp(0, 0.12, THREE.MathUtils.smoothstep(s, 0.6, 0.9));
    }

        if (!snappedRef.current && s > 0.95) {
      snappedRef.current = true;
      const about = document.querySelector("#about");
      if (about) {
        about.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      // reset the flag if the user scrolls back up a lot
    } else if (snappedRef.current && s < 0.4) {
      snappedRef.current = false;
    }

  });

  return (
    <>
      {/* 3D world */}
      <group>
        {/* Grid */}
        <group ref={gridRef}>
          <NeonGrid />
        </group>

        {/* Sun */}
        <group ref={sunRef} position={[0, -20, -60]}>
   <HorizonSun
   position={[0, 0, 0]}
   radius={2.8}
   {...sunColors}
   sunOpacity={0.5}
   haloOpacity={0.24}
   auraOpacity={0.12}
   ringInnerScale={1.0}
   ringOuterScale={1.9}
 />
        </group>

        {/* Clouds — using your breathing version; we’ll read userData.speedBoost */}
        <group ref={cloudsRef}>
          <Clouds
            textureUrl="src/assets/cloud.png"
            count={18}
            horizonZ={-60}
            bandZJitter={5}
            minY={-16}
            maxY={-9}
            bandHalfWidth={130}
            scaleMin={12}
            scaleMax={26}
            sunColors={sunColors}
          />
        </group>
      </group>

      {/* A waypoint marker that fades in near the handoff */}
      <Scroll html>
        <Waypoint />
      </Scroll>
    </>
  );
}

// Simple HTML marker that fades in near the bottom of the first scroll page
function Waypoint() {
  const scroll = useScroll();
  return (
    <div
      style={{
        position: "absolute",
        top: "75vh",
        width: "100%",
        textAlign: "center",
        fontFamily: "system-ui, sans-serif",
        letterSpacing: "0.06em",
        pointerEvents: "none",
        opacity: THREE.MathUtils.clamp((scroll.offset - 0.75) * 6, 0, 1),
        transform: "translateY(0)",
        fontSize: "clamp(14px, 2.2vw, 18px)",
        textShadow: "0 0 12px rgba(255, 179, 71, 0.8)",
        color: "#ffd18f",
      }}
    >
      Projects ↓
    </div>
  );
}

export default function HeroScrollScene() {
  return (
    <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
      {/* 2 pages: the first is your hero; the second hands off to the next section */}
      <ScrollControls pages={2} damping={0.15}>
        <SceneContent />
      </ScrollControls>
    </Canvas>
  );
}
