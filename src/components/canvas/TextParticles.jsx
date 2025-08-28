// src/components/canvas/TextParticles.jsx
import * as THREE from "three";
import React, { useMemo, useRef, useLayoutEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";

/**
 * Renders your text as a cloud of glowing points that animate
 * from a random scatter into letter positions.
 */
export default function TextParticles({
  text = "Hi, I’m Marjut",
  font = "700 140px Inter, system-ui, sans-serif", // 2D canvas font string
  sampleGap = 4,         // pixel step when sampling the text mask (lower = more particles)
  size = 0.06,           // point size in world units
  color = "#ffffff",
  spread = 6,            // how far the initial scatter is (world units)
  position = [0, 1.2, 0],
  maxWidth = 900,        // 2D canvas width used for layout
  align = "center",      // "left" | "center" | "right"
  speed = 1.2,           // animation speed
  faceCamera = true,     // billboard the group (keeps it readable)
}) {
  const group = useRef();
  const materialRef = useRef();
  const { camera } = useThree();

  // 1) Create target positions by drawing text to an offscreen 2D canvas
  const { positions, startPositions, count } = useMemo(() => {
    // draw text
    const canvas = document.createElement("canvas");
    canvas.width = maxWidth;
    canvas.height = Math.round(maxWidth * 0.35); // a decent height for headlines
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = font;
    ctx.fillStyle = "#fff";
    ctx.textAlign = align;
    ctx.textBaseline = "middle";

    const cx = align === "left" ? 0
             : align === "right" ? canvas.width
             : canvas.width / 2;

    ctx.fillText(text, cx, canvas.height / 2);

    // sample opaque pixels -> target points
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const pts = [];
    for (let y = 0; y < canvas.height; y += sampleGap) {
      for (let x = 0; x < canvas.width; x += sampleGap) {
        const idx = (y * canvas.width + x) * 4 + 3; // alpha channel
        if (data[idx] > 128) {
          // center & scale to world units
          const nx = (x - canvas.width / 2) / 100;   // 100px ~ 1 world unit
          const ny = (canvas.height / 2 - y) / 100;  // flip Y
          pts.push(nx, ny, 0);
        }
      }
    }

    const count = pts.length / 3;
    const positions = new Float32Array(pts);

    // initial scatter positions (random sphere)
    const start = new Float32Array(pts.length);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const r = spread * Math.cbrt(Math.random()); // even-ish distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      start[i3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      start[i3 + 1] = r * Math.cos(phi);
      start[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }

    return { positions, startPositions: start, count };
  }, [text, font, sampleGap, maxWidth, align, spread]);

  // 2) Build the buffers once
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    // start positions are what we mutate each frame
    g.setAttribute("position", new THREE.BufferAttribute(startPositions, 3));
    // store the target positions in a separate attribute
    g.setAttribute("target", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions, startPositions]);

  // 3) Animate: start -> target (smooth exponential ease)
  const tRef = useRef(0);
  useFrame((_, delta) => {
    const pos = geom.attributes.position;
    const tgt = geom.attributes.target;
    tRef.current = Math.min(1, tRef.current + delta * speed * 0.6); // progress 0..1
    const ease = 1 - Math.exp(-6 * tRef.current); // nice ease-out

    for (let i = 0; i < pos.count; i++) {
      const i3 = i * 3;
      pos.array[i3 + 0] += (tgt.array[i3 + 0] - pos.array[i3 + 0]) * ease * delta * 6;
      pos.array[i3 + 1] += (tgt.array[i3 + 1] - pos.array[i3 + 1]) * ease * delta * 6;
      pos.array[i3 + 2] += (tgt.array[i3 + 2] - pos.array[i3 + 2]) * ease * delta * 6;
    }
    pos.needsUpdate = true;

    // optional gentle twinkle
    if (materialRef.current) {
      // vary size a touch over time (feels alive, works with bloom)
      materialRef.current.size =
        size * (1 + Math.sin(performance.now() * 0.002) * 0.08);
    }

    // billboard the whole word
    if (faceCamera && group.current) group.current.lookAt(camera.position);
  });

  // 4) Make sure it starts exactly at the scatter before first paint
  useLayoutEffect(() => {
    geom.attributes.position.needsUpdate = true;
  }, [geom]);

  return (
    <group ref={group} position={position}>
      <points geometry={geom}>
        <pointsMaterial
          ref={materialRef}
          color={color}
          size={size}
          sizeAttenuation
          depthWrite={false}
          transparent
          opacity={0.95}
          toneMapped={false}  // let Bloom catch the brightness
        />
      </points>
    </group>
  );
}
