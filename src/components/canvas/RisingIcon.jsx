import { useRef, useLayoutEffect } from "react";
import { useFrame } from "@react-three/fiber";
import IconSvg from "./IconSvg";

export default function RisingIcon({
  url,
  startY = -4,
  endY = 6,
  speed = 0.01,
  baseX = 0,
  baseZ = 0,
  scale = 0.05,
  swirlRadius = 5,
  swirlSpeed = 0,
  pulseSpeed = 2,
  pulseAmount = 0.4,
  color,
  hueShiftSpeed = 0,
  ...props
}) {
  const ref = useRef();
  const phase = useRef(Math.random() * Math.PI * 2);
  const radius = useRef(swirlRadius * (0.8 + Math.random() * 1.2));
  const pulsePhase = useRef(Math.random() * Math.PI * 2);
  const initialY = useRef(startY + Math.random() * (endY - startY));
  const driftPhase = useRef(Math.random() * Math.PI * 2);
  const driftXSpeed = useRef(0.2 + Math.random() * 0.4); // very slow
  const driftZSpeed = useRef(0.2 + Math.random() * 0.4);
  const driftAmp = useRef(0.15 + Math.random() * 0.25); // meters
  const yRef = useRef(initialY.current);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const t = initialY.current + phase.current; // match your swirl formula
    const x = baseX + Math.cos(t) * radius.current;
    const z = baseZ + Math.sin(t) * radius.current;
    ref.current.position.set(x, initialY.current, z);
    ref.current.scale.setScalar(scale); // optional: start at base scale
  }, [baseX, baseZ, scale]);

  useFrame((state, delta) => {
    if (!ref.current) return;

    yRef.current += speed * delta * 60; // smooth logical rise (frame-rate independent)
    if (yRef.current > endY) yRef.current = startY;

    const time = state.clock.elapsedTime;
    const t = yRef.current + phase.current + time * swirlSpeed;

    // swirl position
    let x = baseX + Math.cos(t) * radius.current;
    let z = baseZ + Math.sin(t) * radius.current;

    // subtle organic drift (optional – keep if you like)
    x += Math.sin(time * 0.25 + phase.current) * 0.12;
    z += Math.cos(time * 0.2 + phase.current) * 0.1;

    // vertical bob is now purely visual, not part of the integrator
    const bob = Math.sin(time * 0.9 + phase.current) * 0.02;

    ref.current.position.set(x, yRef.current + bob, z);

    // pulse & tiny tilt (feel free to keep your existing values)
    const raw = Math.sin(time * pulseSpeed + pulsePhase.current); // -1..1
    const throb = 1 - Math.abs(raw); // 0..1, peak at center
    const shaped = Math.pow(throb, 5);   // try 1.4–2.4
    const pulse  = 1 + shaped * pulseAmount;

    ref.current.scale.setScalar(scale * pulse);

    ref.current.rotation.x = Math.sin(time * 0.7 + baseX * 0.3) * 0.14;
    ref.current.rotation.z = Math.cos(time * 0.55 + baseZ * 0.25) * 0.14;
  });

  return (
    <group ref={ref}>
      <IconSvg
        url={url}
        color={color}
        emissive={color}
        hueShiftSpeed={hueShiftSpeed}
        additive
        flicker={0.25}
        {...props}
      />
    </group>
  );
}
