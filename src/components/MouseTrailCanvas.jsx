// MouseTrailCanvas.jsx
import React, { useEffect, useRef } from "react";

/* ---------- tiny helpers ---------- */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const n2 = (x, y) => {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
const catmullRom = (p0, p1, p2, p3, t) => {
  const t2 = t * t, t3 = t2 * t;
  return {
    x: 0.5 * ((2*p1.x) + (-p0.x + p2.x) * t + (2*p0.x - 5*p1.x + 4*p2.x - p3.x) * t2 + (-p0.x + 3*p1.x - 3*p2.x + p3.x) * t3),
    y: 0.5 * ((2*p1.y) + (-p0.y + p2.y) * t + (2*p0.y - 5*p1.y + 4*p2.y - p3.y) * t2 + (-p0.y + 3*p1.y - 3*p2.y + p3.y) * t3),
  };
};

export default function MouseTrailCanvas({
  // Sampling & timing
  maxPoints = 100,
  minStepPx = 2,
  smoothingMs = 100,
  decayPerSec = 0.5,

  // ⬇️ NEW: idle behavior
  idleThresholdMs = 999999,      // how long without samples counts as "idle"
  idleFadeMultiplier = 1,   // how much faster to fade when idle

  // Spline & motion feel
  splineResolution = 11,
  wobble = 0.25,
  wobbleFreq = 0.1,

  // Visual base
  baseLineWidth = 6,
  auraBlur = 10,
  auraAlpha = 0.6,
  baseCoreOpacity = 0.85,

  // Sub-stroke style
  segmentStep = 14,
  segmentJitter = 0.08,
  segmentsPerFrame = 110,

  // Taper scales
  auraTailScale = 0.45,
  auraMidScale  = 1.80,
  auraHeadScale = 0.45,
  coreTailScale = 0.40,
  coreMidScale  = 0.60,
  coreHeadScale = 0.70,

  enabledOnTouch = false,
  className = "absolute inset-0 w-full h-full pointer-events-none",
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);

  // state refs
  const nodes = useRef([]);               // [{x,y,life}]
  const target = useRef({ x: 0, y: 0, have: false });
  const emaPos = useRef({ x: 0, y: 0 });
  const lastAdd = useRef({ x: 0, y: 0, set: false });
  const lastTS = useRef(performance.now());
  const prevForSpeed = useRef({ x: 0, y: 0 });
  const speed = useRef(0);                // px/ms EMA

  // ⬇️ NEW: track last time we sampled a point (used to detect "idle")
  const lastSampleMs = useRef(performance.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });

    /* ---- DPR scaling ---- */
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };
    const ro = new ResizeObserver(resize);
    resize(); ro.observe(canvas);

    /* ---- input ---- */
    const supportsTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      const p = e.touches?.[0] ?? e;
      target.current = { x: p.clientX - r.left, y: p.clientY - r.top, have: true };
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    if (supportsTouch && enabledOnTouch) window.addEventListener("touchmove", onMove, { passive: true });

    /* ---- helpers ---- */
    const resampleCatmullRom = (pts, res) => {
      if (pts.length < 2) return pts;
      const out = [];
      const P = [pts[0], ...pts, pts[pts.length - 1]];
      for (let i = 0; i < P.length - 3; i++) {
        for (let k = 0; k < res; k++) out.push(catmullRom(P[i], P[i+1], P[i+2], P[i+3], k / res));
      }
      out.push(P[P.length - 2]);
      return out;
    };

    const strokeTapered = (sub, { color, wTail, wMid, wHead, alpha, blurPx = 0, comp = "source-over" }) => {
      if (sub.length < 2) return;
      ctx.save();
      ctx.globalCompositeOperation = comp;
      ctx.filter = blurPx ? `blur(${blurPx}px)` : "none";
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.strokeStyle = color;

      const n = sub.length;
      const t1 = Math.max(2, Math.floor(n * 0.34));
      const t2 = Math.max(t1 + 1, Math.floor(n * 0.67));
      const parts = [
        { a: 0,  b: t1,   w: wTail, a0: alpha * 0.9 },
        { a: t1, b: t2,   w: wMid,  a0: alpha      },
        { a: t2, b: n-1,  w: wHead, a0: alpha * 0.95 },
      ];

      for (const { a, b, w, a0 } of parts) {
        if (b - a < 1) continue;
        ctx.globalAlpha = a0;
        ctx.beginPath();
        ctx.moveTo(sub[a].x, sub[a].y);
        for (let i = a + 1; i <= b; i++) ctx.lineTo(sub[i].x, sub[i].y);
        ctx.lineWidth = w;
        ctx.stroke();
      }
      ctx.restore();
    };

    /* ---- RAF loop ---- */
    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.max(1, now - lastTS.current);
      lastTS.current = now;
      const dtSec = dt / 1000;

      // EMA-smoothed target & speed
      if (target.current.have) {
        const a = 1 - Math.exp(-dt / smoothingMs);
        emaPos.current.x = lerp(emaPos.current.x || target.current.x, target.current.x, a);
        emaPos.current.y = lerp(emaPos.current.y || target.current.y, target.current.y, a);

        const dx = emaPos.current.x - prevForSpeed.current.x;
        const dy = emaPos.current.y - prevForSpeed.current.y;
        const inst = Math.hypot(dx, dy) / dt;          // px/ms
        speed.current = speed.current * 0.85 + inst * 0.15;
        prevForSpeed.current = { x: emaPos.current.x, y: emaPos.current.y };

        // sample only if moved enough
        const dx2 = emaPos.current.x - (lastAdd.current.x || 0);
        const dy2 = emaPos.current.y - (lastAdd.current.y || 0);
        if (!lastAdd.current.set || (dx2*dx2 + dy2*dy2) > minStepPx * minStepPx) {
          nodes.current.push({ x: emaPos.current.x, y: emaPos.current.y, life: 1 });
          lastAdd.current = { x: emaPos.current.x, y: emaPos.current.y, set: true };

          // ⬇️ NEW: mark that we just sampled (for idle detection)
          lastSampleMs.current = now;

          if (nodes.current.length > maxPoints) nodes.current.shift();
        }
      }

      // ⬇️ NEW: detect idle (no new samples recently)
      const idleMs = now - lastSampleMs.current;
      const isIdle = idleMs > idleThresholdMs;

      // decay (faster when idle)
      for (let i = nodes.current.length - 1; i >= 0; i--) {
        const p = nodes.current[i];

        // Base decay
        let decay = decayPerSec;

        // 🚀 If idle, fade much faster (gives "instant vanish" feel)
        if (isIdle) decay *= idleFadeMultiplier;

        p.life -= decay * dtSec;
        if (p.life <= 0) nodes.current.splice(i, 1);
      }

      // draw
      const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
      ctx.clearRect(0, 0, w, h);
      if (nodes.current.length < 2) return;

      // spline
      const spline = resampleCatmullRom(nodes.current.map(p => ({ x: p.x, y: p.y })), splineResolution);

      // subtle wobble
      const tSec = now * 0.001, j = wobble * 0.5;
      for (let i = 0; i < spline.length; i++) {
        const p = spline[i], k = i * wobbleFreq + tSec;
        p.x += (n2(k, k + 11) - 0.5) * j;
        p.y += (n2(k + 3, k + 7) - 0.5) * j;
      }

      // color + gradient
      const mx = clamp(emaPos.current.x, 0, w);
      const my = clamp(emaPos.current.y, 0, h);
      const hue = (mx / w) * 360;
      const light = 55 + Math.min(15, speed.current * 120);
      const tailP = spline[0], headP = spline[spline.length - 1];
      const grad = ctx.createLinearGradient(tailP.x, tailP.y, headP.x, headP.y);
      grad.addColorStop(0.0, `hsla(${hue},90%,${light}%,0)`);
      grad.addColorStop(0.5, `hsla(${hue},90%,${light}%,0.35)`);
      grad.addColorStop(1.0, `hsla(${hue},90%,${light}%,0.85)`);
      const baseCore = `hsla(${hue},95%,${Math.min(72, light + 6)}%,${baseCoreOpacity})`;

      // speed modulation
      const sp = Math.min(1.5, speed.current * 1.2);
      const widthBoost = 1 + sp * 1.0;
      const alphaBoost = 1 + sp * 0.5;

      // segment windowing (long, overlapping)
      const effStep = Math.max(12, Math.round(segmentStep * (1 + sp * 0.4)));
      const stride  = Math.max(6, Math.floor(effStep * 0.6)); // ~40% overlap
      const maxSegs = Math.min(segmentsPerFrame, Math.floor((spline.length - effStep) / stride) + 1);

      const avgLife = nodes.current.reduce((a, p) => a + p.life, 0) / nodes.current.length;
      const jitterBase = segmentJitter * 0.6;

      for (let si = 0; si < maxSegs; si++) {
        const start = si * stride, end = start + effStep;
        if (end >= spline.length) break;

        const win = spline.slice(start, end + 1);
        if (win.length < 2) continue;

        // less breakup near head, more near tail
        const lifeIdx = Math.min(nodes.current.length - 1, Math.floor(si * nodes.current.length / maxSegs));
        const lifeAvg = nodes.current[lifeIdx] ? nodes.current[lifeIdx].life : avgLife;
        const jitterScale = jitterBase * (0.2 + 0.8 * (1 - lifeAvg));
        const lenRand = 0.96 + (n2(si * 5.7, tSec * 0.63) - 0.5) * jitterScale;
        const span = Math.max(6, Math.floor(win.length * lenRand));
        const sub = win.slice(0, span);
        if (sub.length < 2) continue;

        // widths
        const auraTailW = baseLineWidth * 1.15 * widthBoost * auraTailScale;
        const auraMidW  = baseLineWidth * 1.15 * widthBoost * auraMidScale;
        const auraHeadW = baseLineWidth * 1.15 * widthBoost * auraHeadScale;
        const coreTailW = Math.max(1.2, baseLineWidth * widthBoost * coreTailScale);
        const coreMidW  = Math.max(1.4, baseLineWidth * widthBoost * coreMidScale);
        const coreHeadW = Math.max(1.6, baseLineWidth * widthBoost * coreHeadScale);

        // AURA
        strokeTapered(sub, {
          color: grad, wTail: auraTailW, wMid: auraMidW, wHead: auraHeadW,
          alpha: clamp(auraAlpha * (0.5 + avgLife * 0.7) * alphaBoost, 0, 1),
          blurPx: auraBlur, comp: "lighter",
        });

        // CORE
        strokeTapered(sub, {
          color: baseCore, wTail: coreTailW, wMid: coreMidW, wHead: coreHeadW,
          alpha: clamp(baseCoreOpacity * alphaBoost, 0, 1),
          comp: "lighter",
        });
      }

      // reset
      ctx.globalAlpha = 1;
      ctx.filter = "none";
      ctx.globalCompositeOperation = "source-over";
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      window.removeEventListener("mousemove", onMove);
      if (supportsTouch && enabledOnTouch) window.removeEventListener("touchmove", onMove);
    };
  }, [
    maxPoints, minStepPx, smoothingMs, decayPerSec,
    idleThresholdMs, idleFadeMultiplier,              // ⬅️ include new deps
    splineResolution, wobble, wobbleFreq,
    baseLineWidth, auraBlur, auraAlpha, baseCoreOpacity,
    segmentStep, segmentJitter, segmentsPerFrame,
    auraTailScale, auraMidScale, auraHeadScale,
    coreTailScale, coreMidScale, coreHeadScale,
    enabledOnTouch
  ]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      style={{ display: "block", background: "transparent" }}
    />
  );
}


