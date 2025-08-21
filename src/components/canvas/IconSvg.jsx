// src/components/IconSvg.jsx
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
  emissive = "#915EFF",
  emissiveIntensity = 1.35,
  metalness = 0.1,
  roughness = 0.4,
  billboard = true,
  ...props
}) {
  const { paths } = useLoader(SVGLoader, url);
  const ref = useRef();
  const { camera } = useThree();
  const matRef = useRef();

  // Make icon face the camera
  useFrame(() => {
    if (billboard && ref.current) ref.current.lookAt(camera.position);
  });

  // Build geometry for both filled and stroke-only SVG paths
  const { fillGeoms, strokeGeoms } = useMemo(() => {
    const fillGeoms = [];
    const strokeGeoms = [];
    for (const p of paths) {
      // Filled parts
      for (const sh of p.toShapes(true))
        fillGeoms.push(new THREE.ShapeGeometry(sh));
      // Stroke parts (if any)
      const style = p.userData.style || {};
      if (style.stroke && style.stroke !== "none") {
        p.subPaths.forEach((sp) => {
          const pts = sp.getPoints();
          const g = SVGLoader.pointsToStroke(pts, style);
          if (g) strokeGeoms.push(g);
        });
      }
    }
    return { fillGeoms, strokeGeoms };
  }, [paths]);

  const material = useMemo(() => {
    // prefer the icon's color for glow; fallback to emissive prop; then default
    const emissiveColor = new THREE.Color(color || emissive || "#915EFF");
    return new THREE.MeshStandardMaterial({
      color: color || "#ffffff", // base albedo (not so visible in dark)
      emissive: emissiveColor, // <- this drives Bloom glow color
      emissiveIntensity,
      metalness,
      roughness,
      side: THREE.DoubleSide,
    });
  }, [color, emissive, emissiveIntensity, metalness, roughness]);

  useFrame(() => {
    if (hueShiftSpeed > 0 && matRef.current) {
      const m = matRef.current.material;
      const hsl = { h: 0, s: 0, l: 0 };
      m.emissive.getHSL(hsl);
      hsl.h = (hsl.h + hueShiftSpeed * 0.001) % 1; // 0..1 loop
      if (!hsl.s) hsl.s = 0.9;
      if (!hsl.l) hsl.l = 0.5;
      m.emissive.setHSL(hsl.h, hsl.s, hsl.l);
    }
  });

  return (
    <group
      ref={ref}
      position={position}
      rotation={rotation}
      scale={scale}
      {...props}
    >
      {fillGeoms.map((g, i) => (
        <mesh 
        key={`f-${i}`} 
        geometry={g} 
        material={material}
        ref={i === 0 ? matRef : null} />
      ))}
      {strokeGeoms.map((g, i) => (
        <mesh key={`s-${i}`} geometry={g} material={material} />
      ))}
    </group>
  );
}
