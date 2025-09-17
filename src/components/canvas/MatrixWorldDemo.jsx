import React, { useRef, useEffect } from "react";

/**
 * MatrixBG — lightweight canvas "digital rain" with hue variation + optional post blur
 *
 * Props:
 *  - density (0.5–2): how many columns
 *  - speed (0.5–2): fall speed
 *  - glow (0–1): extra bloom (also jitters slightly per column)
 *  - opacity (0.05–0.35): overall visibility
 *  - hue (0–360): base hue (120 ≈ green)
 *  - hueJitter (0–90): random hue range around base (e.g., 24 → green→teal)
 *  - saturation (0–100): HSL saturation
 *  - headL (0–100): HSL lightness for the head glyph
 *  - tailL (0–100): HSL lightness for the trailing glyph
 *  - colorShift (bool): let columns slowly drift hue over time
 *  - postBlur (px): GPU blur applied to the canvas element (great for Z-depth)
 *  - className: position utilities (usually absolute inset-0 -z-10)
 */
export default function MatrixBG({
  density = 1,
  speed = 1,
  glow = 0.4,
  opacity = 0.18,
  hue = 120,
  hueJitter = 24,
  saturation = 100,
  headL = 60,
  tailL = 45,
  colorShift = true,
  postBlur = 0,
  className = "absolute inset-0 -z-10 pointer-events-none",
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const c = canvasRef.current;
    const ctx = c.getContext("2d", { alpha: true, willReadFrequently: false });

    const css = () => getComputedStyle(document.documentElement);
    const readVar = (name, fallback) => {
      const v = css().getPropertyValue(name).trim();
      return v ? parseFloat(v) : fallback;
    };

    let w, h, cols, fontSize, drops, glyphs, hues, blurJitter, hueDrift;
    const chars =
      "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ01<>[]{}#$%&*+-/\\|";

    const clampHue = (x) => {
      let v = x % 360;
      if (v < 0) v += 360;
      return v;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = c.clientWidth;
      h = c.clientHeight;
      c.width = Math.floor(w * dpr);
      c.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const d = readVar("--mx-density", density);
      const s = readVar("--mx-speed", speed);
      const o = readVar("--mx-opacity", opacity);
      density = d;
      speed = s;
      c.style.opacity = o;

      fontSize = Math.max(12, Math.floor(16 * density));
      cols = Math.ceil(w / fontSize);

      drops = new Array(cols).fill(0).map(() => Math.floor(Math.random() * -40));
      glyphs = new Array(cols)
        .fill(0)
        .map(() => chars[Math.floor(Math.random() * chars.length)]);

      hues = new Array(cols)
        .fill(0)
        .map(() => clampHue(hue + (Math.random() * 2 - 1) * hueJitter));
      hueDrift = new Array(cols)
        .fill(0)
        .map(() => (Math.random() * 0.05 + 0.01) * (Math.random() < 0.5 ? -1 : 1));

      blurJitter = new Array(cols).fill(0).map(() => 0.6 + Math.random() * 0.8);

      ctx.font = `${fontSize}px "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace`;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(c);

    // pre-darken to avoid first-frame flash
    ctx.fillStyle = `rgba(0,0,0,1)`;
    ctx.fillRect(0, 0, c.width, c.height);

    const draw = () => {
      // soft trails
      ctx.fillStyle = `rgba(0,0,0,${Math.max(0.06, 0.1 / speed)})`;
      ctx.fillRect(0, 0, w, h);

      for (let i = 0; i < cols; i++) {
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        if (colorShift && Math.random() < 0.7) {
          hues[i] = clampHue(hues[i] + hueDrift[i]);
        }

        // head
        const hHead = hues[i];
        ctx.shadowBlur = 8 * glow * blurJitter[i];
        ctx.shadowColor = `hsla(${hHead}, ${saturation}%, ${headL}%, 1)`;
        ctx.fillStyle = `hsla(${hHead}, ${saturation}%, ${headL}%, 0.92)`;
        ctx.fillText(glyphs[i], x, y);

        // tail (dimmer)
        ctx.shadowBlur = 0;
        const hTail = clampHue(hHead - 6);
        ctx.fillStyle = `hsla(${hTail}, ${saturation}%, ${tailL}%, 0.22)`;
        ctx.fillText(glyphs[i], x, y - fontSize);

        // fall
        drops[i] += 1 * speed * (0.9 + Math.random() * 0.3);

        // occasional glyph swap
        if (Math.random() < 0.05) {
          glyphs[i] = chars[Math.floor(Math.random() * chars.length)];
        }

        // reset off-screen
        if (y > h + fontSize * 10) {
          drops[i] = Math.floor(Math.random() * -40);
          if (Math.random() < 0.8) {
            hues[i] = clampHue(hue + (Math.random() * 2 - 1) * hueJitter);
            blurJitter[i] = 0.6 + Math.random() * 0.8;
          }
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [
    density,
    speed,
    glow,
    opacity,
    hue,
    hueJitter,
    saturation,
    headL,
    tailL,
    colorShift,
  ]);

  return (
    <div className={className}>
      {/* Only the canvas is blurred — overlays stay crisp */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ filter: postBlur ? `blur(${postBlur}px)` : "none" }}
      />
      {/* subtle scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none mix-blend-screen"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,.035) 0 1px, rgba(0,0,0,0) 1px 3px)",
        }}
      />
      {/* vignette / depth fog */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0) 60%, rgba(0,0,0,.35) 100%)",
        }}
      />
    </div>
  );
}

// RootMatrixBG.jsx — no rotation; scroll parallax + micro cursor parallax + scanline spotlight + breathing drift + Z-blur
import React, { useEffect, useRef } from "react";
import MatrixBG from "./MatrixBG"; // keep this path as in your project

export default function RootMatrixBG() {
  const wrapRef = useRef(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const mql =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)");
    const prefersReduced = mql && mql.matches;

    const onMove = (e) => {
      if (prefersReduced) return;

      const x = e.clientX / window.innerWidth - 0.5; // -0.5..0.5
      const y = e.clientY / window.innerHeight - 0.5;

      // Spotlight position (percentages)
      el.style.setProperty("--mx-x", `${((x + 0.5) * 100).toFixed(2)}%`);
      el.style.setProperty("--mx-y", `${((y + 0.5) * 100).toFixed(2)}%`);

      // Micro parallax: translate only (no rotation)
      el.style.setProperty("--mx-mlx1", `${(x * -4).toFixed(2)}px`);
      el.style.setProperty("--mx-mly1", `${(y * -4).toFixed(2)}px`);
      el.style.setProperty("--mx-mlx2", `${(x * -7).toFixed(2)}px`);
      el.style.setProperty("--mx-mly2", `${(y * -7).toFixed(2)}px`);
      el.style.setProperty("--mx-mlx3", `${(x * -11).toFixed(2)}px`);
      el.style.setProperty("--mx-mly3", `${(y * -11).toFixed(2)}px`);
    };

    const onScroll = () => {
      if (prefersReduced) return;
      const drift = window.scrollY * -0.03; // global background drift strength
      el.style.setProperty("--mx-parallax", `${drift.toFixed(2)}px`);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      className="fixed inset-0 -z-50 pointer-events-none will-change-transform"
      style={{
        // global scroll drift only (no rotation)
        transform: "translateY(var(--mx-parallax, 0px))",
      }}
    >
      {/* Breathing drift keyframes + custom property registration */}
      <style>{`
        @property --mx-breathe1 { syntax: '<length>'; inherits: false; initial-value: 0px; }
        @property --mx-breathe2 { syntax: '<length>'; inherits: false; initial-value: 0px; }
        @property --mx-breathe3 { syntax: '<length>'; inherits: false; initial-value: 0px; }

        @keyframes breathe1 { 
          0% { --mx-breathe1: -6px; } 
          50% { --mx-breathe1: 6px; } 
          100% { --mx-breathe1: -6px; } 
        }
        @keyframes breathe2 { 
          0% { --mx-breathe2: -8px; } 
          50% { --mx-breathe2: 8px; } 
          100% { --mx-breathe2: -8px; } 
        }
        @keyframes breathe3 { 
          0% { --mx-breathe3: -10px; } 
          50% { --mx-breathe3: 10px; } 
          100% { --mx-breathe3: -10px; } 
        }

        /* Scanline drift (disabled automatically when user prefers reduced motion) */
        @keyframes scanDriftX {
          0% { transform: translateX(0); }
          100% { transform: translateX(-8px); }
        }
        @keyframes scanDriftY {
          0% { transform: translateY(0); }
          100% { transform: translateY(-8px); }
        }
      `}</style>

      {/* LAYER 1: back — dim, slow, most blur + longest breath */}
      <div
        className="absolute inset-0 will-change-transform"
        style={{
          transform:
            "translate3d(var(--mx-mlx1, 0px), calc(var(--mx-mly1, 0px) + var(--mx-breathe1, 0px)), 0) scale(1.02)",
          animation: "breathe1 20s ease-in-out infinite",
        }}
      >
        <MatrixBG
          density={0.85}
          speed={0.75}
          glow={0.35}
          opacity={0.08}
          hue={120}
          hueJitter={18}
          colorShift={false}
          postBlur={1.1} // strongest blur (far)
          className="absolute inset-0"
        />
      </div>

      {/* LAYER 2: mid — moderate blur + medium breath */}
      <div
        className="absolute inset-0 will-change-transform"
        style={{
          transform:
            "translate3d(var(--mx-mlx2, 0px), calc(var(--mx-mly2, 0px) + var(--mx-breathe2, 0px)), 0)",
          animation: "breathe2 16s ease-in-out infinite",
        }}
      >
        <MatrixBG
          density={1.2}
          speed={1.2}
          glow={0.6}
          opacity={0.18}
          hue={120}
          hueJitter={22}
          colorShift={false}
          postBlur={0.5} // light blur (mid)
          className="absolute inset-0"
        />
      </div>

      {/* LAYER 3: front — crisp, fastest + shortest breath */}
      <div
        className="absolute inset-0 will-change-transform"
        style={{
          transform:
            "translate3d(var(--mx-mlx3, 0px), calc(var(--mx-mly3, 0px) + var(--mx-breathe3, 0px)), 0) scale(1.01)",
          animation: "breathe3 12s ease-in-out infinite",
        }}
      >
        <MatrixBG
          density={1.45}
          speed={1.8}
          glow={0.9}
          opacity={0.24}
          hue={120}
          hueJitter={26}
          colorShift={true}
          postBlur={0} // no blur (near)
          className="absolute inset-0"
        />
      </div>

      {/* === Scanline Cursor Spotlight (replaces soft glow) === */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          // We stack: 1) faint hotspot, 2) vertical scanlines, 3) horizontal scanlines.
          background: `
            radial-gradient(240px 180px at var(--mx-x, 50%) var(--mx-y, 50%), rgba(22,255,151,0.12), rgba(22,255,151,0) 70%),
            repeating-linear-gradient(
              90deg,
              rgba(22,255,151,0.055) 0 1px,
              rgba(0,0,0,0) 1px 3px
            ),
            repeating-linear-gradient(
              0deg,
              rgba(22,255,151,0.04) 0 1px,
              rgba(0,0,0,0) 1px 4px
            )
          `,
          // Blend with the scene; 'screen' keeps it bright but not blown out.
          mixBlendMode: "screen",
          // Subtle drift to feel alive; reduced motion users won’t see transform animations.
          animation:
            "scanDriftX 6s linear infinite alternate, scanDriftY 7s linear infinite alternate",
          opacity: 0.9, // you can nudge this to taste (0.7–1)
        }}
      />

      {/* Edge depth-fog for extra dimensionality */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.35), rgba(0,0,0,0) 20%, rgba(0,0,0,0) 80%, rgba(0,0,0,0.35))",
          mixBlendMode: "multiply",
        }}
      />
    </div>
  );
}

//// saved from MatrixStreams.jsx — individual falling streams of glyphs with head glow + sparkles + flickers + depth scaling
export function MatrixStreams({
  streams = 80,
  area = { x: 14, yTop: 9, yBottom: -9, zNear: -6, zFar: -28 },
  speedFactor = 1,
  baseColor = "#33d299",

  // flickers
  flickersPerSecond = 10,
  changesPerFlicker = 3,

  // sparkle runs
  sparkleRunsPerSecond = 0.8,
  sparkleAvgLength = 5,
  sparkleSpeed = 28,
  sparkleGlowBoost = 0.22,
  sparkleAlphaBoost = 0.20,

  // glow under head
  endGlowBoost = 0.35,
  endAlphaBoost = 0.35,
  endGlowSpan = 3,

  // head bulb
  headBulbSize = 0.85,
  headBulbIntensity = 1.6,

  // depth-aware scaling
  bulbSizeNear = 1.2,
  bulbSizeFar = 0.6,
  bulbIntensityNear = 1.3,
  bulbIntensityFar = 0.7,
}) {
  // column x positions
  const columns = useMemo(() => {
    const cols = [];
    const total = area.x * 2;
    for (let i = 0; i < streams; i++) {
      const t = streams === 1 ? 0.5 : (i + 0.5) / streams;
      const baseX = -area.x + t * total;
      const jitter = (total / streams) * 0.12;
      cols.push(baseX + rnd(-jitter, jitter));
    }
    return cols;
  }, [streams, area.x]);

  // per-stream state
  const data = useMemo(() => {
    const arr = [];
    for (let i = 0; i < streams; i++) {
      const tailLen = Math.floor(rnd(12, 24));
      const size = rnd(0.75, 1.1);
      arr.push({
        x: columns[i],
        z: rnd(area.zFar, area.zNear),
        headY: rnd(area.yBottom, area.yTop),
        fall: rnd(2.2, 4.2) * speedFactor,
        size,
        baseOpacity: rnd(0.4, 0.7),
        hueJitter: rnd(-12, 18),
        tailLen,
        chars: Array.from({ length: tailLen }, () =>
          GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
        ),
        distAccum: 0,
        charStep: 1.05,

        // sparkle state
        sparkActive: false,
        sparkStart: 2,
        sparkLen: 5,
        sparkProg: 0,
        sparkLastStep: -1,
      });
    }
    return arr;
  }, [streams, columns, area, speedFactor]);

  // index lookup
  const baseIndex = useMemo(() => {
    const idx = [];
    let acc = 0;
    for (let i = 0; i < data.length; i++) {
      idx.push(acc);
      acc += data[i].tailLen;
    }
    return idx;
  }, [data]);

  const refs = useRef([]);
  refs.current = [];
  const glowSpritesRef = useRef([]);
  glowSpritesRef.current = [];

  // sprite material
  const spriteMat = useMemo(() => {
    const bulbTexture = makeRadialGlowTexture(256);
    return new THREE.SpriteMaterial({
      map: bulbTexture,
      color: new THREE.Color(baseColor),
      transparent: true,
      opacity: 0.9 * headBulbIntensity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      alphaTest: 0.01,
    });
  }, [baseColor, headBulbIntensity]);

  useFrame((state, dt) => {
    const t = state.clock.getElapsedTime();

    for (let si = 0; si < data.length; si++) {
      const s = data[si];

      // fall
      s.headY -= s.fall * dt;

      // shift tail by glyph height
      s.distAccum += s.fall * dt;
      const stepDist = s.charStep * s.size;
      while (s.distAccum >= stepDist) {
        s.distAccum -= stepDist;
        for (let gi = s.tailLen - 1; gi > 0; gi--) {
          s.chars[gi] = s.chars[gi - 1];
        }
        s.chars[0] = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }

      // random flickers
      if (Math.random() < Math.min(0.95, flickersPerSecond * dt)) {
        const n = Math.max(1, Math.min(changesPerFlicker, s.tailLen - 1));
        for (let k = 0; k < n; k++) {
          const j = 1 + Math.floor(Math.random() * (s.tailLen - 1));
          let next = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          if (s.chars[j] !== next) s.chars[j] = next;
        }
      }

      // trigger sparkle run
      if (!s.sparkActive && Math.random() < sparkleRunsPerSecond * dt) {
        s.sparkActive = true;
        s.sparkStart = Math.min(
          s.tailLen - 2,
          1 + Math.floor(Math.random() * 3)
        );
        s.sparkLen = Math.max(
          3,
          Math.min(7, Math.round(rnd(sparkleAvgLength - 1, sparkleAvgLength + 2)))
        );
        s.sparkProg = 0;
        s.sparkLastStep = -1;
      }

      // advance sparkle run
      if (s.sparkActive) {
        s.sparkProg += sparkleSpeed * dt;
        const stepNow = Math.floor(s.sparkProg);
        if (stepNow !== s.sparkLastStep) {
          const j = s.sparkStart + stepNow;
          if (j > 0 && j < s.tailLen) {
            let next = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
            if (s.chars[j] !== next) s.chars[j] = next;
          }
          s.sparkLastStep = stepNow;
        }
        if (s.sparkProg >= s.sparkLen) s.sparkActive = false;
      }

      // recycle if below screen
      if (s.headY < area.yBottom - 2) {
        s.headY = area.yTop + s.tailLen * s.size * rnd(0.2, 1.0);
        s.x = columns[si] + rnd(-0.02, 0.02);
        s.z = rnd(area.zFar, area.zNear);
        s.distAccum = 0;
        for (let gi = 0; gi < s.tailLen; gi++) {
          if (Math.random() < 0.8) {
            s.chars[gi] = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          }
        }
        s.sparkActive = false;
      }

      // per-stream depth factor
      const zN = area.zNear, zF = area.zFar;
      const depthT = clamp01((s.z - zN) / (zF - zN));
      const d = smooth01(depthT);

      // glyph draw
      const hueBase = 120 + s.hueJitter + Math.sin((t + si) * 0.1) * 6;
      for (let gi = 0; gi < s.tailLen; gi++) {
        const idx = baseIndex[si] + gi;
        const m = refs.current[idx];
        if (!m) continue;

        const posY = s.headY + gi * s.charStep * s.size;
        m.position.set(s.x, posY, s.z);

        const isHead = gi === 0;
        const sparkFront = s.sparkActive ? s.sparkStart + s.sparkProg : -999;
        const isSparked =
          s.sparkActive &&
          gi >= s.sparkStart &&
          gi <= Math.min(s.tailLen - 1, Math.floor(sparkFront));

        let lightness = isHead ? 0.70 : 0.46;
        let alpha =
          isHead
            ? Math.min(1.0, s.baseOpacity + 0.35)
            : Math.max(0.10, s.baseOpacity - gi * 0.03);

        // head-trailing glow with depth fade
        if (gi <= endGlowSpan) {
          const k = 1 - gi / Math.max(1, endGlowSpan);
          const depthFade = lerp(1.0, 0.75, d);
          lightness = Math.min(0.99, lightness + endGlowBoost * k * depthFade);
          alpha = Math.min(1.0, alpha + endAlphaBoost * k * depthFade);
        }

        if (isSparked) {
          lightness = Math.min(0.99, lightness + sparkleGlowBoost * 0.6);
          alpha = Math.min(1.0, alpha + sparkleAlphaBoost * 0.6);
        }

        const hue = isHead ? hueBase : hueBase - (isSparked ? 2 : 6);

        m.material.color.setHSL(hue / 360, 1, lightness);
        m.material.opacity = alpha;

        const ch = s.chars[gi];
        if (m.text !== ch) {
          m.text = ch;
          if (m.sync) m.sync();
        }
      }

      // head bulb sprite (depth-aware)
      const spr = glowSpritesRef.current[si];
      if (spr) {
        spr.position.set(s.x, s.headY, s.z + 0.01);
        const sizeMul = lerp(bulbSizeNear, bulbSizeFar, d);
        const intensityMul = lerp(bulbIntensityNear, bulbIntensityFar, d);
        const pulse = 1 + Math.sin((t * 5.5 + si * 0.7)) * 0.08;
        const scale = headBulbSize * s.size * sizeMul * pulse;
        spr.scale.setScalar(scale);
        spr.material.opacity = Math.min(1, 0.9 * headBulbIntensity * intensityMul);
      }
    }
  });

  return (
    <group>
      {/* Head glow sprites */}
      {data.map((s, si) => (
        <sprite
          key={`spr-${si}`}
          ref={(r) => r && (glowSpritesRef.current[si] = r)}
          material={spriteMat}
          position={[s.x, s.headY, s.z + 0.01]}
        />
      ))}

      {/* Glyphs */}
      {data.map((s, si) =>
        Array.from({ length: s.tailLen }).map((_, gi) => {
          const idx = baseIndex[si] + gi;
          return (
            <Text
              key={idx}
              ref={(r) => r && (refs.current[idx] = r)}
              position={[s.x, s.headY + gi * s.charStep * s.size, s.z]}
              fontSize={s.size}
              characters={GLYPHS}
              letterSpacing={0.02}
              anchorX="center"
              anchorY="middle"
              depthOffset={-1}
            >
              {s.chars[gi]}
              <meshBasicMaterial
                transparent
                opacity={s.baseOpacity}
                color={baseColor}
                blending={THREE.AdditiveBlending}
                toneMapped={false}
              />
            </Text>
          );
        })
      )}
    </group>
  );
}

