import React, {
  Suspense,
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import {
  Preload,
  useGLTF,
  Text,
  Float,
  Billboard,
  Sparkles,
  Environment,
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
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";

/* ---------- tiny helpers ---------- */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

const ICON_PATHS = ["/icons/code-bracket.svg"];
ICON_PATHS.forEach((url) => {
  try {
    useLoader.preload(SVGLoader, url);
  } catch {}
});

function SafeComposer({ children }) {
  const { gl } = useThree();
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const canvas = gl.getContext?.()?.canvas || gl.domElement;
    const check = () => {
      const ctx = gl.getContext?.();
      const ok =
        ctx && ctx.isContextLost?.() === false && ctx.getContextAttributes?.();
      setReady(Boolean(ok));
    };
    // initial check + listeners for loss/restore
    check();
    const onLost = (e) => {
      e.preventDefault?.();
      setReady(false);
    };
    const onRestored = () => {
      check();
    };
    canvas.addEventListener("webglcontextlost", onLost, { passive: false });
    canvas.addEventListener("webglcontextrestored", onRestored);
    return () => {
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
    };
  }, [gl]);

  return ready ? <EffectComposer>{children}</EffectComposer> : null;
}

/* function HorizonScrollerText({ progress, isMobile }) {
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => 1 - Math.pow(1 - t, 3);

  const p = clamp(progress, 0, 1);
  const eased = ease(p);

  // Position further back and higher, sinks as you scroll
  const z = -70;
  const y = lerp(-9, -9, eased); // starts high, slowly lowers
  const headline = isMobile ? 2 : 7;
  const sub = isMobile ? 0.45 : 0.8;

  const magenta = "#ff2bd3";
  const cyan = "#00eaff";
  const white = "#ffffff";

  return (
    <Billboard position={[0, y, z]} follow>
      <group>
        <Text
          fontSize={headline}
          fontWeight="bold"
          anchorX="center"
          anchorY="middle"
          color={magenta}
          material-toneMapped={false}
          material-depthTest={false}
          renderOrder={998}
          fillOpacity={5}
        >
          Hi, I'm Marjut.
        </Text>

        <Text
          position={[0, -headline * 0.55, 0]}
          fontSize={sub}
          anchorX="center"
          anchorY="top"
          color="#e7e7ff"
          material-toneMapped={false}
          material-depthTest={false}
          renderOrder={1000}
          maxWidth={isMobile ? 5.2 : 10}
          lineHeight={1.1}
          fillOpacity={0.7}
        >
          3D visuals • UI • web apps
        </Text>
      </group>
    </Billboard>
  );
} */

// Big horizon text with heavy neon glow (no Bloom required)
function BackgroundNeonText({
  text = "CHALLENGING TO BE INNOVATIVE PLANS • ",
  repeats = 3,
  font = "/fonts/Gliker-Black.woff",
}) {
  // build a long repeated line
  const content = new Array(repeats).fill(text).join(" ");

  return (
    <group position={[0, -15, -60]}>
      {/* GLOW LAYER */}
      <Text
        font={font}
        text={content}
        fontSize={10} // big + far = horizon scale
        maxWidth={240}
        lineHeight={1}
        anchorX="center"
        anchorY="middle"
        color="#ffffff" // glow color (hot pink/red)
        fillOpacity={0} // we only want the outline for the glow
        outlineWidth={0.0001} // thickness of glow
        outlineColor="#ffffff"
        outlineOpacity={0.6}
        outlineBlur={0.1} // ← soft wash
        material-toneMapped={false}
        material-transparent
        material-depthTest={false}
        // make the outline accumulate like neon
        onSync={(self) => {
          const m = self.material;
          m.blending = THREE.AdditiveBlending;
          m.needsUpdate = true;
        }}
        renderOrder={1}
      />

      {/* CORE LAYER (sharp white text) */}
      <Text
        font={font}
        text={content}
        fontSize={10} // tiny bit smaller to sit inside the glow
        maxWidth={240}
        lineHeight={1}
        anchorX="center"
        anchorY="middle"
        color="#ffffff"
        fillOpacity={1}
        outlineWidth={0} // no outline here
        material-toneMapped={false}
        material-transparent
        material-depthTest={false}
        renderOrder={2}
      />
    </group>
  );
}

/* ---------- camera rig: mouse parallax + scroll travel ---------- */
function CameraParallax({
  target = [0, 0, 0],
  basePos = [0, 5.5, 20],
  move = 1.2,
  ease = 0.08,
  progress = 0, // NEW: 0..1 scroll progress
  travelZ = 12, // NEW: how far forward we move
  travelY = -0.8, // NEW: slight dip
}) {
  const { camera, gl } = useThree();
  const targetPos = useRef([...basePos]);
  const mouseN = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const el = gl.domElement;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const mx = (e.clientX - r.left) / r.width;
      const my = (e.clientY - r.top) / r.height;
      mouseN.current.x = (mx - 0.5) * 2;
      mouseN.current.y = (my - 0.5) * 2;
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
    const eased = easeOutCubic(progress);
    const z = basePos[2] - travelZ * eased; // 20 → ~8
    const y = basePos[1] + travelY * eased; // 5.5 → ~4.7

    const px = basePos[0] + -mouseN.current.x * move; // parallax
    const py = y + mouseN.current.y * move * 0.6;

    targetPos.current[0] += (px - targetPos.current[0]) * ease;
    targetPos.current[1] += (py - targetPos.current[1]) * ease;
    targetPos.current[2] += (z - targetPos.current[2]) * ease;

    camera.position.set(...targetPos.current);
    camera.lookAt(...target);
  });

  return null;
}

function BrightDistantText({
  text = "Hi, I'm Marjut. I'm a software engineer.",
  repeats = 4,
  font = "/fonts/Gliker-Black.woff",
  pos = [0, -18, -80],
}) {
  const content = new Array(repeats).fill(text).join(" ");

  return (
    <group position={pos}>
      {/* BRIGHT CORE — crisp, no glow */}
      <Text
        text={content}
        font={font}
        fontSize={10}
        maxWidth={260}
        lineHeight={1}
        anchorX="center"
        anchorY="middle"
        color="#ffffff"
        // Key bits:
        material-toneMapped={false} // don’t get dimmed by tone mapping
        material-fog={false} // ignore scene fog → stays bright at distance
        material-transparent
        material-depthTest={false} // draw on top of faint fog haze
        material-depthWrite={false}
        outlineOpacity={0.9}
        outlineBlur={0.2}
        outlineColor="#fce98a"
        renderOrder={10}
        onSync={(self) => {
          const m = self.material;
          m.blending = THREE.AdditiveBlending; // makes white add light, not gray
          m.needsUpdate = true;
        }}
      />

      {/* Thin outline just to keep edges readable on the grid */}
      <Text
        text={content}
        font={font}
        fontSize={10.02}
        maxWidth={260}
        lineHeight={1}
        anchorX="center"
        anchorY="middle"
        color="#000000"
        fillOpacity={0}
        outlineWidth={0.06} // slim edge, not a glow
        outlineColor="#000000"
        outlineOpacity={0.35}
        material-toneMapped={false}
        material-fog={false}
        material-transparent
        material-depthTest={false}
        material-depthWrite={false}
        renderOrder={9}
      />
    </group>
  );
}

// --- Cozy Lo-Fi material helper ---------------------------------------------
function applyLoFiMaterials(root, THREE) {
  if (!root) return;

  const tintMaterial = (mat, { color = "#caa47c", rough = 0.85, metal = 0.05, emissive, emissiveIntensity } = {}) => {
    if (!mat) return;
    const apply = (m) => {
      if (m.color) m.color.set(color);
      if (typeof m.roughness === "number") m.roughness = rough;
      if (typeof m.metalness === "number") m.metalness = metal;
      if (emissive && m.emissive) m.emissive.set(emissive);
      if (emissiveIntensity && m.emissiveIntensity !== undefined) m.emissiveIntensity = emissiveIntensity;
      m.needsUpdate = true;
    };
    Array.isArray(mat) ? mat.forEach(apply) : apply(mat);
  };

  root.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;

    const matName = (child.material?.name || "").toLowerCase();
    const nodeName = (child.name || "").toLowerCase();

    // Simple rules: wood, metal, lampshade, everything else = warm paper
    if (/(wood|desk|top|board|table)/.test(matName + " " + nodeName)) {
      tintMaterial(child.material, { color: "#a0714a", rough: 0.85, metal: 0.08 }); // warm wood
    } else if (/(metal|leg|stand|hinge|arm)/.test(matName + " " + nodeName)) {
      tintMaterial(child.material, { color: "#4d4f55", rough: 0.6, metal: 0.35 }); // matte metal
    } else if (/(shade|lamp|cloth)/.test(matName + " " + nodeName)) {
      tintMaterial(child.material, { color: "#c88a5b", rough: 0.8, metal: 0.05 }); // warm lampshade
    } else {
      // default soft beige “paper” feel for any leftovers
      tintMaterial(child.material, { color: "#cbb79c", rough: 0.9, metal: 0.03 });
    }
  });
}


const Computers = ({ isMobile, progress }) => {
  const computer = useGLTF("./desktop_pc/scene.gltf");
  const desk = useGLTF("./desk/desk.glb");
  const lamp = useGLTF("./lamp/lampSquareTable.glb");

  const risingConfig = useMemo(() => {
    if (isMobile) {
      return {
        icons: ICON_PATHS,
        count: 24,
        xSpread: 4,
        zSpread: 2,
        swirlRadius: 1.4,
        swirlSpeed: 0.12,
        startY: -4,
        endY: 5.5,
        speedMin: 0.006,
        speedMax: 0.012,
        itemScaleMin: 0.35,
        itemScaleMax: 0.6,
        pulseAmount: 0.35,
        pulseSpeed: 1.6,
        colors: ["#fb465b"],
        hueShiftChance: 0.35,
        hueShiftSpeedMin: 0.4,
        hueShiftSpeedMax: 1.0,
        centerX: 0,
        centerZ: 0,
        seed: 1337,
      };
    }
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
  const sunRefCb = useCallback((node) => node && setSunObj(node), []);

  const sunColors = {
    coreColor: "#ff7a00",
    haloColor: "#ffb347",
    auraColor: "#ffd18f",
  };

  React.useEffect(() => {
    applyLoFiMaterials(desk.scene, THREE);
    if (lamp?.scene) applyLoFiMaterials(lamp.scene, THREE);
  }, [desk, lamp]);

  // derive some simple scene changes from scroll
  const p = clamp(progress, 0, 1);
  const gridSpeed = 2.6 + 3.0 * easeOutCubic(p); // subtle speed-up
  const sunY = -20 - 4 * easeOutCubic(p); // gentle dip

  return (
    <group>
      {/* lights */}
      <ambientLight intensity={0.35} />
      <hemisphereLight intensity={0.25} groundColor="#0a0a0a" />
      <spotLight
        position={[-20, 50, 10]}
        angle={0.18}
        penumbra={0.9}
        intensity={1.1}
        castShadow
        shadow-mapSize={1024}
      />
      <pointLight intensity={0.8} position={[2, 2, 2]} />

      <primitive
        object={desk.scene}
        scale={isMobile ? 0.7 : 5}
        position={isMobile ? [-1.75, 1.9, 17] : [-1.75, 1.8, 17]}
        rotation={[-0.09, 0, 0]}
        receiveShadow
      />

      <group
        // keep your original placement here
        position={isMobile ? [-1.75, 1.9, 17] : [1, 4, 16.7]}
        rotation={[-0.09, 0, 0]}
        scale={isMobile ? 0.7 : 3}
      >
        {/* the lamp model */}
        <primitive object={lamp.scene} />

        {/* bulb sphere so you can see the source (adjust offset to sit under the shade) */}
        <mesh position={[0, 0.6, 0]} castShadow>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial
            color="#ffdfb8"
            emissive="#ffdfb8"
            emissiveIntensity={2.0}
            roughness={0.6}
            metalness={0.0}
          />
        </mesh>

        {/* the actual lamp light */}
        <pointLight
          position={[0, 0.6, 0]} // same as the bulb sphere
          color="#ffb278" // warm lo-fi glow
          intensity={5}
          distance={8}
          decay={2}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-bias={-0.0005}
          shadow-normalBias={0.02}
        />
      </group>

      <Sparkles
        count={1000}
        scale={[200, 200, 200]}
        size={5}
        speed={0.05}
        opacity={0.25}
        color="#ffffff"
      />

      {/* post-processing */}
      <EffectComposer>
        <Bloom
          mipmapBlur
          intensity={0.1}
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

        <Vignette eskil={false} offset={0.25} darkness={0.1} />
      </EffectComposer>
    </group>
  );
};

const ComputersCanvas = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1 over ~1.2 viewport heights

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 500px)");
    setIsMobile(mq.matches);
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", onChange);

    // window scroll → progress
    const onScroll = () => {
      const vh = window.innerHeight;
      const max = vh * 1.2; // tune how much scroll it takes
      const p = clamp(window.scrollY / max, 0, 1);
      setProgress(p);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      mq.removeEventListener("change", onChange);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <Canvas
      frameloop="always"
      shadows
      dpr={[1, 1.25]}
      camera={{ position: [0, 5.5, 20], fov: 30 }}
      gl={{
        antialias: false,
        powerPreference: "high-performance",
        alpha: false,
        depth: true,
        stencil: true,
        // DO NOT set preserveDrawingBuffer here
      }}
      onCreated={({ gl }) => {
        const canvas = gl.getContext().canvas;
        // Allow the browser to auto-restore the context
        canvas.addEventListener("webglcontextlost", (e) => e.preventDefault(), {
          passive: false,
        });
      }}
    >
      <color attach="background" args={["#000000"]} />
      <fog attach="fog" args={["#000000", 18, 140]} />
      <Suspense fallback={<CanvasLoader />}>
        {/* Uncomment if you want a night HDRI: <Environment preset="night" intensity={5} /> */}
        {/*       <CameraParallax
          target={[0, 0.0, 0]}
          basePos={[0, 5.5, 20]}
          move={1.2}
          ease={0.08}
          progress={progress} // ← NEW
          travelZ={12}
          travelY={-0.8}
        /> */}
        <Computers isMobile={isMobile} progress={progress} />
        <Preload all />
      </Suspense>
    </Canvas>
  );
};

export default ComputersCanvas;
