import React, {
  Suspense,
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Preload,
  useGLTF,
  Text,
  Float,
  Billboard,
  Sparkles,
  Environment
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
import { useLoader } from "@react-three/fiber";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import RisingIconsCloud from "./RisingIconsCloud.jsx";
import NeonGrid from "./NeonGrid.jsx";
import { HorizonSun, SunRays } from "./HorizonSunWithRays";
import Clouds from "./Clouds.jsx";

// Keep this outside the component so it doesn't re-create each render
const ICON_PATHS = [
  "/icons/heart.svg",
/*   "/icons/sparkles.svg",
  "/icons/command-line.svg", */
];

ICON_PATHS.forEach((url) => {
  try {
    useLoader.preload(SVGLoader, url);
  } catch (e) {
    // In dev with fast-refresh you might see duplicate calls; it's safe to ignore
    // or you can guard with a Set if needed.
  }
});

function HeroText3D({ isMobile }) {
  const headRef = useRef();

  // heartbeat-like pulse (sharp but not jittery)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const raw = Math.sin(t * 2.2); // speed
    const throb = Math.pow(1 - Math.abs(raw), 2.0); // shape it
    const s = 1 + throb * 0.06; // amount (6%)
    if (headRef.current) headRef.current.scale.set(s, s, 1);
  });

  // position the whole block
  const pos = isMobile ? [-1.2, 1.2, 0.2] : [-7.8, 2.5, 0.15];

  return (
    <Billboard>
      <group position={pos}>
        {/* Glow copy 1 (purple) */}
        <Text
          position={[0, 0, -0.01]}
          fontSize={isMobile ? 0.42 : 1}
          anchorX="left"
          anchorY="top"
          color="#9b5cff"
          opacity={0.55}
          material-toneMapped={false}
          material-depthTest={false}
          renderOrder={999}
        >
          Hi, I’m Marjut
        </Text>

        {/* Glow copy 2 (cyan), tiny offset for duotone aura */}
        <Text
          position={[0.01, -0.01, -0.02]}
          fontSize={isMobile ? 0.42 : 1}
          anchorX="left"
          anchorY="top"
          color="#00e5ff"
          opacity={0.45}
          material-toneMapped={false}
          material-depthTest={false}
          renderOrder={999}
        >
          Hi, I’m Marjut
        </Text>

        {/* Crisp main headline */}
        <Text
          ref={headRef}
          fontSize={isMobile ? 0.42 : 1.1}
          anchorX="left"
          anchorY="top"
          color="#ffffff"
          outlineWidth={0.02}
          outlineColor="#111111"
          outlineOpacity={0.7}
          material-toneMapped={false}
          material-depthTest={false}
          renderOrder={1000}
        >
          Hi, I’m Marjut
        </Text>

        {/* Subtitle */}
        <Text
          position={[0, isMobile ? -0.62 : -1.02, 0]}
          fontSize={isMobile ? 0.22 : 0.34}
          anchorX="left"
          anchorY="top"
          color="#d6d6ff"
          opacity={0.95}
          material-toneMapped={false}
          material-depthTest={false}
          renderOrder={1000}
          maxWidth={isMobile ? 2.8 : 5}
          lineHeight={1.18}
        >
          I build 3D visuals, user interfaces, and web apps.
        </Text>
      </group>
    </Billboard>
  );
}

function LaserSweep({
  width = 260,
  y = -5.58,
  tilt = -0.3,
  zStart = 28,
  zEnd = -65,
  speed = 12,
}) {
  const ref = useRef();
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.position.z -= speed * dt;
    if (ref.current.position.z < zEnd) ref.current.position.z = zStart;
  });

  return (
    <group rotation={[tilt, 0, 0]}>
      <mesh ref={ref} position={[0, y + 0.02, zStart]}>
        <planeGeometry args={[width, 0.8, 1, 1]} />
        <meshBasicMaterial
          color="#ff66cc"
          transparent
          opacity={0.55}
          toneMapped={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

const Computers = ({ isMobile }) => {
  const computer = useGLTF("./desktop_pc/scene.gltf");

  // One place to adjust the hurricane behavior
  const risingConfig = useMemo(() => {
    if (isMobile) {
      return {
        icons: ICON_PATHS,
        count: 24,
        xSpread: 4,
        zSpread: 2,
        swirlRadius: 1.4,
        swirlSpeed: 0.12,

        // vertical motion
        startY: -4,
        endY: 5.5,
        speedMin: 0.006,
        speedMax: 0.012,

        // scale (baseline; pulse sits on top)
        itemScaleMin: 0.35,
        itemScaleMax: 0.6,

        // pulse
        pulseAmount: 0.35,
        pulseSpeed: 1.6,

        // color + glow drift
        colors: ["#fb465b"],
        hueShiftChance: 0.35,
        hueShiftSpeedMin: 0.4,
        hueShiftSpeedMax: 1.0,

        // positioning
        centerX: 0,
        centerZ: 0,

        // random seed (same layout until you change this)
        seed: 1337,
      };
    }

    // Desktop
    return {
      icons: ICON_PATHS,
      count: 60,
      xSpread: 10,
      zSpread: 20,
      swirlRadius: 5,
      swirlSpeed: 0.05,

      startY: -4,
      endY: 6.5,
      speedMin: 0.009,
      speedMax: 0.018,

      itemScaleMin: 0.4,
      itemScaleMax: 0.7,

      pulseAmount: 0.6,
      pulseSpeed: 2.0,

      colors: ["#fb465b"],
      hueShiftChance: 0.35,
      hueShiftSpeedMin: 0.4,
      hueShiftSpeedMax: 1.0,

      centerX: 0,
      centerZ: 0,

      seed: 20250821,
    };
  }, [isMobile]);

  const [sunObj, setSunObj] = useState(null);
  const sunRefCb = useCallback((node) => {
    // called with the mesh on mount, and null on unmount
    if (node) setSunObj(node);
  }, []);

  const sunColors = {
    coreColor: "#ff7a00",
    haloColor: "#ffb347",
    auraColor: "#ffd18f",
  };

  return (
    <group>
      {/* lights */}
      <ambientLight intensity={0.6} />
      <hemisphereLight intensity={0.5} groundColor="#0a0a0a" />
      <spotLight
        position={[-20, 50, 10]}
        angle={0.18}
        penumbra={0.9}
        intensity={1.1}
        castShadow
        shadow-mapSize={1024}
      />
      <pointLight intensity={0.8} position={[2, 2, 2]} />

      {/* configurable hurricane of icons  */}
{/*       <RisingIconsCloud config={risingConfig} /> */}

      <Sparkles
        count={5000}
        scale={[200, 200, 200]}
        size={10}
        speed={0.05}
        opacity={0.25}
        color="#ffffff"
      />

      <NeonGrid
        size={260}
        divisions={90}
        y={-4.6}
        tilt={-0.3}
        speed={2.6}
        strength={1.1}
      />

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
        // omit `tint` to auto-use sunColors
        sunColors={sunColors}
      />

      <HorizonSun
        ref={sunRefCb}
        position={[0, -20, -60]}
        radius={2.8}
        coreColor="#ff7a00" // 🔶 strong orange core
        haloColor="#ffb347" // peachy ring
        auraColor="#ffd18f" // wide soft aura
        sunOpacity={0.5}
        haloOpacity={0.24} // was ~0.10
        auraOpacity={0.12} // was ~0.05
        ringInnerScale={1.0}
        ringOuterScale={1.9}
      />

      <LaserSweep width={260} />

      {/* computer model */}
{/*    <primitive
        object={computer.scene}
        scale={isMobile ? 0.7 : 0.75}
        position={isMobile ? [0, -3, -2.2] : [0, 0, 0]}
        rotation={[-0.005, -0.6, 0.4]}
      /> */}
      {/* <TextParticles
        text="Hi, I’m Marjut"
        position={[-2.0, 1.6, 0.2]} // move where you like
        align="left"
        sampleGap={4} // 2 = dense, 6 = lighter
        size={0.06}
        color="#ffffff"
      />*/}
      {/* 3D Intro Text */}
      {/*<Float
        // gentle float so it feels part of the scene
        speed={1.2} // animation speed
        rotationIntensity={0.15} // subtle tilt
        floatIntensity={0.5} // up/down bob
      >
        <HeroText3D isMobile={isMobile} />
      </Float>*/}
      {/* subtle global glow*/}

      <EffectComposer>
        <Bloom
          mipmapBlur
          intensity={0.4}
          luminanceThreshold={0.28}
          luminanceSmoothing={0.1}
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

        <Vignette eskil={false} offset={0.32} darkness={0.7} />

        {sunObj && (
          <SunRays
            sun={sunObj}
            samples={isMobile ? 48 : 48} // fewer samples
            density={1} // less thick
            decay={0.92} // fades sooner
            weight={isMobile ? 0.35 : 0.35} // much lighter
            exposure={0.22} // overall brightness down
            clampMax={0.7} // hard cap so it can't blow out
            blur
          />
        )}
      </EffectComposer>
    </group>
  );
};

function CameraParallax({
  target = [0, 0, 0], // where the camera looks
  basePos = [12, 5, 8], // your current camera position
  move = 1.2, // how far the camera moves (parallax amount)
  ease = 0.08, // smoothing (0..1) – higher = snappier
}) {
  const { camera, gl } = useThree();
  const targetPos = useRef([...basePos]); // animated position
  const mouseN = useRef({ x: 0, y: 0 }); // normalized mouse (-1..1)

  useEffect(() => {
    // use the canvas bounds so it only tracks inside the hero canvas
    const el = gl.domElement;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const mx = (e.clientX - r.left) / r.width; // 0..1
      const my = (e.clientY - r.top) / r.height; // 0..1
      mouseN.current.x = (mx - 0.5) * 2; // -1..1
      mouseN.current.y = (my - 0.5) * 2; // -1..1
    };
    const onLeave = () => {
      mouseN.current.x = 0;
      mouseN.current.y = 0;
    };
    el.addEventListener("mousemove", onMove, { passive: true });
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [gl]);

  useFrame(() => {
    // subtle parallax: move camera opposite to mouse for depth-y feel
    const tx = basePos[0] + -mouseN.current.x * move;
    const ty = basePos[1] + mouseN.current.y * move * 0.6;
    const tz = basePos[2];

    // ease toward target position
    targetPos.current[0] += (tx - targetPos.current[0]) * ease;
    targetPos.current[1] += (ty - targetPos.current[1]) * ease;
    targetPos.current[2] += (tz - targetPos.current[2]) * ease;

    camera.position.set(...targetPos.current);
    camera.lookAt(...target);
  });

  return null;
}

const ComputersCanvas = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 500px)");
    setIsMobile(mq.matches);
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <Canvas
      frameloop="always"
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 5.5, 20], fov: 30 }}
      gl={{ preserveDrawingBuffer: true, antialias: true }}
    >
      <color attach="background" args={["#000000"]} />
      <fog attach="fog" args={["#000000", 18, 85]} />
      <Suspense fallback={<CanvasLoader />}>
        <CameraParallax
          target={[0, 0.0, 0]} // look toward the horizon
          basePos={[0, 5.5, 20]} // match Canvas camera
          move={1.2}
          ease={0.08} // 0.05–0.12 feels nice
        />
        {/* <Environment preset="night" intensity={5} /> */}
        <Computers isMobile={isMobile} />
        <Preload all />
      </Suspense>
    </Canvas>
  );
};

export default ComputersCanvas;
