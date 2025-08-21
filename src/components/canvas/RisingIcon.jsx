import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import IconSvg from "./IconSvg"; // or however you render your SVG

export default function RisingIcon({
  url,
  startY = -4,
  endY = 6,
  speed = 0.01,
  baseX = 0,
  baseZ = 0,
  scale = 0,
  swirlRadius = 5, // how wide the wind swirl is
  swirlSpeed = 0,  // how fast the swirl spins
  pulseSpeed = 2,      // Add: how fast the pulse animates
  pulseAmount = 0.4,   // Add: how much the scale changes
  color,
  hueShiftSpeed = 0,
  ...props
}) {
  const ref = useRef();
  // Each icon gets a random phase and swirl radius
  const phase = useRef(Math.random() * Math.PI * 2);
  const radius = useRef(swirlRadius * (0.8 + Math.random() * 1.2)); // 0.8x to 2x swirlRadius
  const pulsePhase = useRef(Math.random() * Math.PI * 2); // Each icon pulses at a different time

  useFrame((state, delta) => {
    if (ref.current) {
      let y = ref.current.position.y + speed * delta * 60;
      if (y > endY) y = startY;
      // Circular (wind) motion
      const t = y + phase.current + state.clock.elapsedTime * swirlSpeed;
      const x = baseX + Math.cos(t) * radius.current;
      const z = baseZ + Math.sin(t) * radius.current;
      ref.current.position.set(x, y, z);

      // Pulse effect
      const pulse =
        1 + Math.sin(state.clock.elapsedTime * pulseSpeed + pulsePhase.current) * pulseAmount;
      ref.current.scale.setScalar(scale * pulse);
    }
  });

  return (
    <group ref={ref}>
      <IconSvg
      url={url}
      color={props.color}
      emissive={props.color}
      hueShiftSpeed={hueShiftSpeed}
      {...props} />
    </group>
  );
}