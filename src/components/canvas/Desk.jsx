// Desk.jsx
import React, { Suspense, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Preload,
  useGLTF,
  Text,
  Sparkles,
  GradientTexture,
  Html, // ⬅️ for CTA button overlay
} from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  DepthOfField,
  Noise,
  Vignette,
  ChromaticAberration,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

import CanvasLoader from "../Loader";

/* ---------- Background gradient plane (with gentle drift) ---------- */
function BackgroundGradient({ top = "#2b165c", bottom = "#120a28" }) {
  const meshRef = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (meshRef.current) {
      // very slight vertical drift to keep the sky from feeling static
      meshRef.current.position.y = 25 + Math.sin(t * 0.05) * 0.6;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 25, -60]} scale={[220, 140, 1]} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial depthWrite={false}>
        <GradientTexture stops={[0, 1]} colors={[bottom, top]} size={1024} />
      </meshBasicMaterial>
    </mesh>
  );
}

/* ---------- Tiny handheld-style camera drift ---------- */
function CameraDrift() {
  useFrame(({ clock, camera }) => {
    const t = clock.getElapsedTime();
    camera.position.x = Math.sin(t * 0.12) * 0.35;
    camera.position.y = 7 + Math.sin(t * 0.08) * 0.25;
    camera.lookAt(0, 5, 15);
  });
  return null;
}

/* ---------- Glowy hero text ---------- */
function HeroText() {
  const group = useRef(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (group.current) {
      group.current.rotation.z = Math.sin(t * 0.25) * 0.01;
      group.current.position.y = 7.2 + Math.sin(t * 0.35) * 0.06;
    }
  });

  return (
    <group ref={group} position={[1, 0, 7]}>
      <mesh position={[0, 0.2, -0.1]}>
        <planeGeometry args={[7.5, 2.6]} />
        <meshBasicMaterial
          color="#000000"
          opacity={0.25}
          transparent
          depthWrite={false}
        />
      </mesh>

      <Text
        position={[-0.5, -1.9, 0]}
        rotation={[-0.25, 0, 0]}
        fontSize={0.9}
        anchorX="center"
        anchorY="middle"
        color="#f5e6d3"
        outlineWidth={0.02}
        outlineColor="#ffb278"
        outlineOpacity={0.25}
        maxWidth={20}
        toneMapped={false}
      >
        Hi, I'm Marjut
      </Text>

      <Text
        position={[-0.5, -3, 0]}
        rotation={[-0.15, 0, 0]}
        fontSize={0.6}
        anchorX="center"
        anchorY="middle"
        color="#e7dcc8"
        outlineWidth={0.012}
        outlineColor="#ffb278"
        outlineOpacity={0.18}
        maxWidth={20}
        toneMapped={false}
      >
        Software Developer & Designer
      </Text>
    </group>
  );
}

const Desk = ({ isMobile }) => {
  const desk = useGLTF("./desk/desk.glb");
  const lamp = useGLTF("./lamp/lampSquareTable.glb");
  const plant = useGLTF("./plant/plantSmall2.glb");
  const laptop = useGLTF("./laptop/laptop.glb");

    // lamp flicker ref
  const lampLightRef = useRef();
  const bulbMatRef = useRef();

    // soft, natural “breathing” flicker (very subtle)
useFrame(({ clock }) => {
  const t = clock.getElapsedTime();

  // layered sines + a slow pulse + tiny jitter
  const slowPulse = 0.5 + 0.5 * Math.sin(t * 0.7);         // 0..1
  const layered =
    Math.sin(t * 6.3) * 0.45 +                              // mid frequency
    Math.sin(t * 13.1 + 1.3) * 0.25 +                       // higher freq
    Math.sin(t * 21.7 + 0.7) * 0.12;                        // high freq spice

  const jitter = (Math.sin(t * 50.0 + Math.sin(t * 7.0)) * 0.5 + 0.5) * 0.12; // tiny randomness

  // base + amplitude (turn these up/down to taste)
  const base = 12.0;          // was 13
  const amp  = 1.1;           // was ~0.2 total; now clearly visible

  const flicker = base + amp * (layered + jitter) + slowPulse * 0.6;

  if (lampLightRef.current) lampLightRef.current.intensity = flicker;
  if (bulbMatRef.current)   bulbMatRef.current.emissiveIntensity = 2.2 + (flicker - base) * 0.5;
});


  return (
    <group>
      {/* lights */}
      <ambientLight intensity={0.25} color="#3b4a6b" />
      <hemisphereLight
        intensity={0.2}
        skyColor="#9fb3ff"
        groundColor="#0a0a0a"
      />

      {/* desk */}
      <primitive
        object={desk.scene}
        scale={isMobile ? 0.7 : 17}
        position={isMobile ? [-1.75, 1.9, 17] : [-6, -3.9, 17]}
        rotation={[-0.37, 0, 0]}
        receiveShadow
      />

      {/* plant */}
      <primitive
        object={plant.scene}
        scale={isMobile ? 0.7 : 14}
        position={isMobile ? [-1.75, 1.9, 17] : [-3.4, 2, 13.5]}
        rotation={[-0.37, 0, 0]}
        receiveShadow
      />

      {/* laptop */}
      <primitive
        object={laptop.scene}
        scale={isMobile ? 0.7 : 12}
        position={isMobile ? [-1.75, 1.9, 17] : [-1.4, 2.5, 14.7]}
        rotation={[-0.37, 0, 0]}
        receiveShadow
      />

      {/* lamp */}
      <group
        position={isMobile ? [-1.75, 1.9, 17] : [3, 2.1, 13.5]}
        rotation={[-0.37, 0, 0]}
        scale={isMobile ? 0.7 : 9}
      >
        <primitive object={lamp.scene} />
        <mesh position={[0, 0.8, 0]} castShadow>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial
          ref={bulbMatRef}
            color="#ffdfb8"
            emissive="#ffdfb8"
            emissiveIntensity={2.6}
            roughness={0.6}
            metalness={0}
          />
        </mesh>
        <pointLight
          ref={lampLightRef}
          position={[0, 0.3, 0]}
          color="#ffb278"
          intensity={12}
          distance={10}
          decay={2}
          castShadow
        />
      </group>

      {/* text */}
      {/* <HeroText /> */}

      {/* dust motes */}
      <Sparkles
        position={[0, 0, 5]}
        count={280}
        scale={[50, 30, 50]}
        size={0.9}
        speed={0.04}
        opacity={0.22}
        color="#fff8e7"
      />

      {/* radial light stain under lamp */}
      <mesh
        position={[3, 1.5, 13.5]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[4, 4, 1]}
      >
        <circleGeometry args={[1, 64]} />
        <meshBasicMaterial color="#000000" opacity={0.3} transparent />
      </mesh>

      {/* post-processing */}
      <EffectComposer>
        <Bloom
          mipmapBlur
          intensity={0.45}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.12}
        />
        <DepthOfField
          focusDistance={0.0001}
          focalLength={0.002}
          bokehScale={0.5}
          height={600}
        />
        <ChromaticAberration
          offset={[0.0005, 0.0005]}
          radialModulation
          modulationOffset={0.3}
        />
        <Noise
          premultiply
          blendFunction={BlendFunction.SOFT_LIGHT}
          opacity={0.08}
        />
        <Vignette eskil={false} offset={0.4} darkness={0.6} />
      </EffectComposer>
    </group>
  );
};

const DeskCanvas = () => {
  const [isMobile] = useState(false);

  return (
    <Canvas
      frameloop="always"
      shadows
      dpr={[1, 1.25]}
      camera={{ position: [0, 7, 22], fov: 40 }}
      gl={{
        antialias: false,
        powerPreference: "high-performance",
        alpha: false,
        depth: true,
        stencil: true,
      }}
      onCreated={({ gl }) => {
        gl.getContext().canvas.addEventListener(
          "webglcontextlost",
          (e) => e.preventDefault(),
          { passive: false }
        );
      }}
    >
      <color attach="background" args={["#120a28"]} />
      <fog attach="fog" args={["#120a28", 18, 140]} />

      <BackgroundGradient top="#2b165c" bottom="#120a28" />
      {/* <CameraDrift /> */}

      <Suspense fallback={<CanvasLoader />}>
        <Desk isMobile={isMobile} />
        <Preload all />
      </Suspense>
    </Canvas>
  );
};

export default DeskCanvas;
