// ParticleDust.jsx — glowing dust / sparks layer
import React, { useRef, useEffect } from "react";

export default function ParticleDust({
  count = 80,
  color = "hsla(120, 100%, 65%, 0.8)", // green glow
  size = 2,
  speed = 0.15,
  className = "absolute inset-0 pointer-events-none",
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const c = canvasRef.current;
    const ctx = c.getContext("2d");
    let w, h;
    let particles = [];

    const resize = () => {
      w = c.clientWidth;
      h = c.clientHeight;
      c.width = w;
      c.height = h;

      particles = new Array(count).fill(0).map(() => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: Math.random() * 1 + 0.5, // depth factor
        dx: (Math.random() - 0.5) * 0.2,
        dy: (Math.random() - 0.5) * 0.2,
      }));
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      particles.forEach((p) => {
        p.x += p.dx * p.z * speed;
        p.y += p.dy * p.z * speed;

        // wrap around edges
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        const r = size * p.z * (0.6 + Math.random() * 0.4);

        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.shadowBlur = 12 * p.z;
        ctx.shadowColor = color;
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      });

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [count, color, size, speed]);

  return (
    <canvas ref={canvasRef} className={`w-full h-full ${className}`} />
  );
}
