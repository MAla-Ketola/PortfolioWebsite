// DigitalSparks.jsx — pixel-locked, glowing "data bits" + light mouse attraction
import React, { useRef, useEffect } from "react";

export default function DigitalSparks({
  count = 120,                     // how many bits
  grid = 6,                        // pixel grid size (px) → more "digital" when smaller
  baseSpeed = 0.22,                // drift speed baseline
  laneBias = -1,                   // -1 = mostly up, +1 = mostly down, 0 = neutral
  hue = 120,                       // 120 ≈ green
  sat = 100,
  light = 65,
  glow = 16,                       // shadow blur intensity
  maxDepth = 1.8,                  // Z depth multiplier (1..maxDepth)
  pulse = 0.6,                     // flicker amplitude (0..1)
  jumpChance = 0.008,              // random "bit-jump" probability each frame
  useMouseSpotlight = true,        // attract toward spotlight set by RootMatrixBG
  className = "absolute inset-0 pointer-events-none mix-blend-screen", // additive feel
}) {
  const canvasRef = useRef(null);
  const raf = useRef(0);

  useEffect(() => {
    const c = canvasRef.current;
    const ctx = c.getContext("2d", { alpha: true });

    let w = 0, h = 0, t = 0;
    let bits = [];

    const randSign = () => (Math.random() < 0.5 ? -1 : 1);

    const resize = () => {
      w = c.clientWidth | 0;
      h = c.clientHeight | 0;
      c.width = w;
      c.height = h;

      // (re)seed bits
      bits = new Array(count).fill(0).map(() => ({
        // snap to grid for digital look
        x: Math.round((Math.random() * w) / grid) * grid,
        y: Math.round((Math.random() * h) / grid) * grid,
        z: 1 + Math.random() * (maxDepth - 1),           // 1..maxDepth
        // lanes prefer mostly vertical motion; small lateral jitter
        vx: ((Math.random() - 0.5) * 0.15) * grid,
        vy: ((Math.random() * 0.6 + 0.2) * (laneBias || -1)) * grid, // up by default
        // per-bit time offset for flicker/pulse
        phase: Math.random() * Math.PI * 2,
        // “channel” color offset to sprinkle teal/green variance
        hueJitter: (Math.random() * 16 - 8),
        // occasional tiny rotation for the square
        rot: (Math.random() - 0.5) * 0.25,
        // each bit keeps its own jump timer so it "teleports" sometimes
        nextJump: Math.random() * 120 + 60, // frames
      }));
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(c);

    const readSpotlight = () => {
      if (!useMouseSpotlight) return null;
      const parent = c.parentElement; // RootMatrixBG layers set CSS vars on wrapper
      if (!parent) return null;
      const cs = getComputedStyle(parent);
      const mx = cs.getPropertyValue("--mx-x").trim();
      const my = cs.getPropertyValue("--mx-y").trim();
      if (!mx || !my) return null;
      // convert e.g. "43.12%" → px
      const sx = (parseFloat(mx) / 100) * w;
      const sy = (parseFloat(my) / 100) * h;
      return { sx, sy };
    };

    const draw = () => {
      t += 1;

      // mild afterimage trail for cyber feel (darken a touch instead of full clear)
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.fillRect(0, 0, w, h);

      // additive glow
      ctx.globalCompositeOperation = "lighter";

      const spot = readSpotlight();

      for (let i = 0; i < bits.length; i++) {
        const b = bits[i];

        // small attraction toward spotlight (pull stronger for closer bits in Z)
        if (spot) {
          const ax = (spot.sx - b.x) * 0.0006 * b.z;
          const ay = (spot.sy - b.y) * 0.0006 * b.z;
          b.vx += ax;
          b.vy += ay;
        }

        // advance in lanes, then quantize to grid (feels "digital")
        const s = baseSpeed * (0.6 + b.z * 0.4); // farther bits drift a bit faster
        b.x += b.vx * s;
        b.y += b.vy * s;

        // grid snap (post-move)
        b.x = Math.round(b.x / grid) * grid;
        b.y = Math.round(b.y / grid) * grid;

        // wrap around edges (teleport to keep density constant)
        if (b.x < 0) b.x = w - grid;
        if (b.x >= w) b.x = 0;
        if (b.y < 0) b.y = h - grid;
        if (b.y >= h) b.y = 0;

        // occasional "bit-jump" to a nearby grid cell (looks like packet hopping)
        b.nextJump -= 1;
        if (b.nextJump <= 0 || Math.random() < jumpChance) {
          b.x = Math.round((b.x + randSign() * grid * (1 + (Math.random() * 3 | 0))) / grid) * grid;
          b.y = Math.round((b.y + randSign() * grid * (1 + (Math.random() * 3 | 0))) / grid) * grid;
          b.nextJump = Math.random() * 120 + 60;
        }

        // binary-ish flicker (0/1 brightness bias) on top of a smooth pulse
        const bin = (Math.sin((t + b.phase * 60) * 0.25) > 0 ? 1 : 0);
        const flicker = 0.7 + pulse * 0.3 * Math.sin(t * 0.08 + b.phase);
        const alpha = 0.6 * (0.8 + 0.2 * bin) * flicker;

        // compute size: pixel squares scaling with depth, with light scan-stretch
        const zScale = 0.8 + b.z * 0.6;
        const px = Math.max(1, Math.round(grid * 0.9 * zScale));
        const py = Math.max(1, Math.round(grid * (1.1 + 0.2 * Math.sin(t * 0.03 + b.phase))));

        // color (tiny hue variance per bit)
        const H = (hue + b.hueJitter + 360) % 360;
        const fill = `hsla(${H}, ${sat}%, ${light}%, ${alpha.toFixed(3)})`;

        // glow
        ctx.shadowBlur = glow * b.z;
        ctx.shadowColor = fill;

        // draw a rotated pixel square (subtle) to break uniformity
        ctx.save();
        ctx.translate(b.x + px * 0.5, b.y + py * 0.5);
        ctx.rotate(b.rot * 0.05);
        ctx.fillStyle = fill;
        ctx.fillRect(-px * 0.5, -py * 0.5, px, py);
        ctx.restore();

        // tiny "data trail": a dimmer square one step behind
        ctx.shadowBlur = 0;
        const trailA = alpha * 0.35;
        if (trailA > 0.02) {
          ctx.fillStyle = `hsla(${H}, ${sat}%, ${Math.max(30, light - 20)}%, ${trailA.toFixed(3)})`;
          const tx = Math.round((b.x - b.vx * s) / grid) * grid;
          const ty = Math.round((b.y - b.vy * s) / grid) * grid;
          ctx.fillRect(tx, ty, Math.max(1, px - 1), Math.max(1, py - 1));
        }
      }

      raf.current = requestAnimationFrame(draw);
    };

    raf.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf.current);
      ro.disconnect();
    };
  }, [count, grid, baseSpeed, laneBias, hue, sat, light, glow, maxDepth, pulse, jumpChance, useMouseSpotlight]);

  return <canvas ref={canvasRef} className={`w-full h-full ${className}`} />;
}
