// IconSvg.jsx
import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useLoader, useThree, useFrame } from "@react-three/fiber";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";

export default function IconSvg({
  url,
  color,
  hueShiftSpeed = 0,
  scale = 0.03,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  emissive = "#ff5e5e",
  emissiveIntensity = 1.35,
  metalness = 0.1,
  roughness = 0.4,
  billboard = true,
  additive = false,
  flicker = 0.9,
  // NEW wobble controls
  tiltAmount = 0.5, // try 0.25–0.45 (radians)
  tiltSpeed = 2.0, // wobble speed
  ...props
}) {
  const { paths } = useLoader(SVGLoader, url);

  // parent faces camera; child gets extra tilt so you can SEE wobble
  const faceRef = useRef(); // billboarded parent
  const tiltRef = useRef(); // post-billboard tilt child
  const { camera } = useThree();
  const matRef = useRef();

  // per-icon random phases to avoid sync
  const tiltPhase = useRef(Math.random() * Math.PI * 2);
  const flickerPhase = useRef(Math.random() * Math.PI * 2);
  const flickerHz = useRef(12 + Math.random() * 6);
  const flickerAmp = useRef(flicker * 0.1);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (billboard && faceRef.current) faceRef.current.lookAt(camera.position);

    // 🔸 visible wobble: apply AFTER billboard on a child node
    if (tiltRef.current) {
      const tx =
        Math.sin(t * tiltSpeed + tiltPhase.current) * tiltAmount * 0.25;
      const tz =
        Math.cos(t * tiltSpeed * 0.8 + tiltPhase.current) * tiltAmount * 0.25;
      tiltRef.current.rotation.x = tx;
      tiltRef.current.rotation.z = tz;
    }

    // subtle emissive flicker (kept moderate so it reads through Bloom)
    if (flicker && matRef.current) {
      const m = matRef.current.material;
      const wobble =
        1 +
        Math.sin(t * flickerHz.current + flickerPhase.current) *
          flickerAmp.current;
      m.emissiveIntensity = emissiveIntensity * wobble;
    }
  });

  // build geoms/material (unchanged, just ensure toneMapped: false for strong emissive)
  const { fillGeoms, strokeGeoms } = useMemo(() => {
    const fillGeoms = [],
      strokeGeoms = [];
    for (const p of paths) {
      for (const sh of p.toShapes(true)) {
        if (sh && sh.getPoints().length > 0) {
          fillGeoms.push(new THREE.ShapeGeometry(sh));
        } else {
          console.warn("Empty shape in SVG:", url);
        }
      }
      const style = p.userData.style || {};
      if (style.stroke && style.stroke !== "none") {
        p.subPaths.forEach((sp) => {
          const pts = sp.getPoints();
          const g = SVGLoader.pointsToStroke(pts, style);
          if (g && g.attributes.position && g.attributes.position.count > 0) {
            strokeGeoms.push(g);
          } else {
            console.warn("Empty stroke in SVG:", url);
          }
        });
      }
    }
    return { fillGeoms, strokeGeoms };
  }, [paths, url]);

  const material = useMemo(() => {
    const emissiveColor = new THREE.Color(color || emissive || "#ff5e5e");
    return new THREE.MeshStandardMaterial({
      color: color || "#ffffff",
      emissive: emissiveColor,
      emissiveIntensity,
      metalness,
      roughness,
      side: THREE.DoubleSide,
      transparent: additive,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: !additive,
      toneMapped: false, // keeps emissive punchy so flicker is visible
    });
  }, [color, emissive, emissiveIntensity, metalness, roughness, additive]);

  // hue drift (unchanged)
  useFrame(() => {
    if (hueShiftSpeed > 0 && matRef.current) {
      const m = matRef.current.material;
      const hsl = { h: 0, s: 0, l: 0 };
      m.emissive.getHSL(hsl);
      hsl.h = (hsl.h + hueShiftSpeed * 0.001) % 1;
      if (!hsl.s) hsl.s = 0.9;
      if (!hsl.l) hsl.l = 0.5;
      m.emissive.setHSL(hsl.h, hsl.s, hsl.l);
    }
  });

  return (
    <group
      ref={faceRef}
      position={position}
      rotation={rotation}
      scale={scale}
      {...props}
    >
      <group ref={tiltRef}>
        {fillGeoms.map((g, i) => (
          <mesh
            key={`f-${i}`}
            geometry={g}
            material={material}
            ref={i === 0 ? matRef : null}
          />
        ))}
        {strokeGeoms.map((g, i) => (
          <mesh key={`s-${i}`} geometry={g} material={material} />
        ))}
      </group>
    </group>
  );
}
