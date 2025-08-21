import React, { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Preload, useGLTF } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

import CanvasLoader from "../Loader";
import RisingIconsCloud from "./RisingIconsCloud.jsx";

const ICON_PATHS = [
  "/icons/code-bracket.svg",
  "/icons/sparkles.svg",
  "/icons/command-line.svg",
];

const Computers = ({ isMobile }) => {
  const computer = useGLTF("./desktop_pc/scene.gltf");

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

      {/* placeholder model (your current computer) */}
      <primitive
        object={computer.scene}
        scale={isMobile ? 0.7 : 0.75}
        position={isMobile ? [0, -3, -2.2] : [0, -3.25, -1.5]}
        rotation={[-0.01, -0.2, -0.1]}
      />

      {/* hurricane of icons */}
      <RisingIconsCloud
        icons={ICON_PATHS}
        count={isMobile ? 18 : 60}
        xSpread={isMobile ? 4 : 5}
        zSpread={isMobile ? 2 : 4}
        swirlRadius={isMobile ? 1 : 20}
        swirlSpeed={isMobile ? 0.1 : 0.1}
      />

      {/* global glow */}
      <EffectComposer>
        <Bloom
          mipmapBlur
          intensity={1.1}
          luminanceThreshold={0.22}
          luminanceSmoothing={0.14}
        />
      </EffectComposer>
    </group>
  );
};

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
      // animations run continuously so the floaters move
      frameloop="always"
      shadows
      dpr={[1, 2]}
      camera={{ position: [12, 5, 8], fov: 35 }}
      gl={{ preserveDrawingBuffer: true }}
    >
      {/* dark background to sell the neon */}
      <color attach="background" args={["#0b0b10"]} />

      <Suspense fallback={<CanvasLoader />}>
        <OrbitControls
          enableZoom={false}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 2}
        />
        <Computers isMobile={isMobile} />
        <Preload all />
      </Suspense>
    </Canvas>
  );
};

export default ComputersCanvas;
