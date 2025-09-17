// MysteriousDesk.jsx — Virtual-scroll zoom toward the laptop (no browser scrollbar)
// Drop-in replacement. Requires @react-three/drei (you already have it).

import React, { Suspense, useRef, useState, useMemo, useEffect } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Preload,
  useGLTF,
  Text,
  ScrollControls,
  useScroll,
  Html,
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

import { About } from "../";

/** =========================
 * Screen alignment constants
 * Adjust to fit your laptop GLTF’s screen cutout.
 * ========================= */
const SCREEN_POS = new THREE.Vector3(0.13, 0.1, -0.1);
const SCREEN_ROT = new THREE.Euler(0, 0, 0);
const SCREEN_SCALE = new THREE.Vector3(0.23, 0.2, 1);

/** Canvas-based static for CRT-ish noise */
function useStaticNoiseTexture(size = 128) {
  const { texture, ctx, canvas } = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    return { texture, ctx, canvas };
  }, [size]);

  const update = useRef(0);
  useFrame((_, delta) => {
    update.current += delta;
    if (update.current < 1 / 15) return;
    update.current = 0;

    const w = canvas.width,
      h = canvas.height;
    const imageData = ctx.createImageData(w, h);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const v = Math.random() * 255;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);
    texture.needsUpdate = true;
  });

  return texture;
}

function LaptopScreen({ color = "#cbd0ce" }) {
  const matRef = useRef();
  const staticTex = useStaticNoiseTexture(128);
  const flashRef = useRef(0);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    let opacity = 0.65 + Math.sin(t * 18) * 0.15 + Math.sin(t * 7) * 0.05;
    if (flashRef.current > 0) {
      opacity += 0.35 * (flashRef.current / 1.0);
      flashRef.current -= 0.05;
    } else if (Math.random() < 0.012) {
      flashRef.current = 1.0;
    }
    if (matRef.current)
      matRef.current.opacity = THREE.MathUtils.clamp(opacity, 0.1, 1);
  });

  return (
    <group position={SCREEN_POS} rotation={SCREEN_ROT} scale={SCREEN_SCALE}>
      <mesh>
        <planeGeometry args={[1, 0.6]} />
        <meshBasicMaterial
          ref={matRef}
          map={staticTex}
          transparent
          toneMapped={false}
          color={color}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

function ScreenPortal({ active, children }) {
  // Laptop group position (matches where your laptop lives)
  const scroll = useScroll();
  const portalTarget =
    scroll && scroll.fixed ? { current: scroll.fixed } : undefined;
  return (
    <group
      position={[
        0.5, -6.8, 0
      ]}
      rotation={[-0.8, 0, 0]}
      scale={0.21}
    >
      <Html
        transform
        position={[0, 0, 0]}   // tiny +Z to avoid z-fighting
        // ⛓️ Pin Html to the *fixed* non-scrolling layer so it won’t drift
        portal={portalTarget}
        style={{
          width: 1300,
          height: 800,
          background: "#0b0f12",
          borderRadius: 8,
          overflow: "hidden",
          userSelect: "text",
          outline: active ? "2px solid #aaffee" : "none",
          boxShadow: active ? "0 0 24px rgba(170,255,238,0.25)" : "none",
        }}
      >
        {active ? children : null}
      </Html>
    </group>
  );
}

function ScreenName({ text = "> marjut ak", color = "#aaffee" }) {
  const [visible, setVisible] = useState(0);
  useEffect(() => {
    setVisible(0);
    const id = setInterval(() => {
      setVisible((v) => (v < text.length ? v + 1 : v));
    }, 55);
    return () => clearInterval(id);
  }, [text]);

  return (
    <group
      position={SCREEN_POS.clone().add(new THREE.Vector3(0, 0, 0.002))}
      scale={SCREEN_SCALE}
    >
      <Text
        fontSize={0.095}
        color={color}
        anchorX="left"
        anchorY="middle"
        maxWidth={1.6}
        outlineWidth={0.002}
        outlineColor="#00110f"
      >
        {text.slice(0, visible)}
      </Text>
    </group>
  );
}

function EnterFlash({ duration = 0.4 }) {
  const matRef = useRef();
  const t0 = useRef(0);

  useFrame((state) => {
    if (!t0.current) t0.current = state.clock.elapsedTime;
    const t = (state.clock.elapsedTime - t0.current) / duration;
    if (matRef.current) {
      matRef.current.opacity = THREE.MathUtils.clamp(1 - t, 0, 1);
    }
  });

  return (
    <mesh position={[0, 0, 13.9]} rotation={[-0.45, 0, 0]}>
      <planeGeometry args={[20, 12]} />
      <meshBasicMaterial ref={matRef} color="#ffffff" transparent opacity={1} />
    </mesh>
  );
}

function InsideUI() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#0b0f12",
        color: "#e6f2ef",
        overflow: "auto",
      }}
    >
      {/* Example: Terminal-ish landing */}
      <div
        style={{
          padding: 24,
          fontFamily: "monospace",
          fontSize: 18,
          lineHeight: 1.5,
        }}
      >
        <div style={{ opacity: 0.7, marginBottom: 8 }}>booting…</div>
        <div>&gt; about</div>
        <p style={{ maxWidth: 640, opacity: 0.9 }}>
          Games Technology grad → frontend/UX dev. Projects, experiments, and a
          soft spot for lofi vibes.
        </p>

        <nav style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <About />
          <button>About</button>
          <button>Projects</button>
          <button>Contact</button>
        </nav>
      </div>
    </div>
  );
}

/** Easing for the zoom */
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function CameraRigWithHandoff({ onEnter }) {
  const { camera } = useThree();
  const scroll = useScroll();

  const vFrom = useMemo(() => new THREE.Vector3(0, 12, 26), []);
  const vTo = useMemo(() => new THREE.Vector3(0.0, 8.5, 20), []);
  const lookFrom = useMemo(() => new THREE.Vector3(0, 2.5, 17), []);
  const lookTo = useMemo(() => new THREE.Vector3(-0, 4, 14), []);

  const tmpPos = useMemo(() => new THREE.Vector3(), []);
  const tmpLook = useMemo(() => new THREE.Vector3(), []);

  const enteredRef = useRef(false);

// Remove the onEnter bits
useFrame(() => {
  const raw = THREE.MathUtils.clamp(scroll.offset, 0, 1);
  const t = easeInOutCubic(raw);

  tmpPos.lerpVectors(vFrom, vTo, t);
  tmpLook.lerpVectors(lookFrom, lookTo, t);
  camera.position.lerp(tmpPos, 0.12);
  camera.lookAt(tmpLook);

  const fovFrom = 90, fovTo = 13;
  camera.fov += (THREE.MathUtils.lerp(fovFrom, fovTo, t) - camera.fov) * 0.12;
  camera.updateProjectionMatrix();
});
  return null;
}

const Desk = ({ isMobile, showStatic = true }) => {
  const desk = useGLTF("./desk/desk.glb");
  const lamp = useGLTF("./lamp/lampSquareTable.glb");
  const laptop = useGLTF("./laptop/laptop.glb");

  return (
    <group>
      {/* lights */}
      <ambientLight intensity={0.25} color="#161d2c" />
      <hemisphereLight intensity={0.2} skyColor="#ffffff" groundColor="#0a0a0a" />

      {/* desk */}
      <primitive
        object={desk.scene}
        scale={isMobile ? 0.7 : 17}
        position={isMobile ? [-1.75, 1.9, 17] : [-6, -3.9, 17]}
        rotation={[-0.45, 0, 0]}
        receiveShadow
      />

      {/* laptop + screen overlay */}
      <group
        scale={isMobile ? 0.7 : 12}
        position={isMobile ? [-1.75, 1.9, 17] : [-1.4, 2.5, 14.5]}
        rotation={[-0.45, 0, 0]}
      >
        <primitive object={laptop.scene} receiveShadow />
        {/* {showStatic && <LaptopScreen />} */}
        {/* <ScreenName text="> marjut ak — portfolio" /> */}
      </group>

      {/* lamp */}
      <group
        position={isMobile ? [-1.75, 1.9, 17] : [3, 2.1, 13.5]}
        rotation={[-0.45, 0, 0]}
        scale={isMobile ? 0.7 : 9}
      >
        <primitive object={lamp.scene} />
        <mesh position={[0.05, 3, 0]} castShadow>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={1.5}
            roughness={0.6}
            metalness={0}
          />
        </mesh>
        <pointLight
          position={[0, 0.3, 0]}
          color="#ffffff"
          intensity={5}
          distance={2}
          decay={2}
          castShadow
        />
      </group>

      {/* radial light stain under lamp */}
      <mesh position={[3, 1.5, 13.5]} rotation={[-Math.PI / 2, 0, 0]} scale={[4, 4, 1]}>
        <circleGeometry args={[1, 64]} />
        <meshBasicMaterial color="#000000" opacity={0.3} transparent />
      </mesh>

      {/* post-processing */}
      <EffectComposer>
        <Bloom mipmapBlur intensity={0.45} luminanceThreshold={0.2} luminanceSmoothing={0.12} />
        <DepthOfField focusDistance={0.0001} focalLength={0.002} bokehScale={0.5} height={600} />
        <ChromaticAberration offset={[0.0005, 0.0005]} radialModulation modulationOffset={0.3} />
        <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.08} />
        <Vignette eskil={false} offset={0.4} darkness={0.6} />
      </EffectComposer>
    </group>
  );
};

const TestCanvas = () => {
  const [isMobile] = useState(false);

  return (
    <Canvas
      frameloop="always"
      shadows
      dpr={[1, 1.25]}
      camera={{ position: [0, 12, 26], fov: 90 }}
      gl={{ antialias: false, powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#000000"]} />
      <fog attach="fog" args={["#1f1f1f", 18, 60]} />

      <ScrollControls pages={2} damping={0.15}>
        <Suspense fallback={<CanvasLoader />}>
          <Desk isMobile={isMobile} />
          <Preload all />

          {/* Use scroll offset to fade/show UI */}
          <ScreenPortal active>
            <InsideUI />
          </ScreenPortal>
        </Suspense>

        <CameraRigWithHandoff />
      </ScrollControls>
    </Canvas>
  );
};


export default TestCanvas;

