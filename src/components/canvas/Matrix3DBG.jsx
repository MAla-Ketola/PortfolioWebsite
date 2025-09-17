// Matrix3DBG.jsx
import React, { useRef, useEffect } from "react";
import * as THREE from "three";

/**
 * Matrix3DBG (Three.js instanced glyphs)
 * Props: density, speed, opacity, hue (like your MatrixBG)
 *
 * Simple usage: <Matrix3DBG density={0.9} speed={0.9} />
 *
 * Notes:
 * - This creates an atlas canvas of glyphs and a shader-based instanced mesh
 *   where each instance gets a glyph index attribute (so one plane geometry used many times).
 * - Animation moves instances along Z toward camera and cycles them.
 * - Keep density low -> higher performance; tweak instanceCount and gridDepth.
 */

export default function Matrix3DBG({
  density = 1,
  speed = 1.0,
  opacity = 0.18,
  hue = 120,
  className = "absolute inset-0 -z-10 pointer-events-none",
}) {
  const mountRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // scene, camera, renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      40,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 6);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0); // transparent
    mount.appendChild(renderer.domElement);

    // parameters (adjust for perf)
    const columns = Math.max(20, Math.floor(60 * density)); // horizontal count target
    const rowsVisible = 20; // glyphs in view per column
    const depthLayers = 8; // how many layers deep (affects ripple spacing)
    const instanceCount = columns * rowsVisible * depthLayers;

    // glyph set (same feel as your canvas version)
    const chars =
      "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ01<>[]{}#$%&*+-/\\|";
    const glyphCount = chars.length;

    // 1) Build a texture atlas canvas (grid of glyphs)
    const atlasCols = 16; // pick comfortable grid dims (<= glyphCount)
    const atlasRows = Math.ceil(glyphCount / atlasCols);
    const glyphPx = 64; // pixel size for each glyph in atlas
    const atlasCanvas = document.createElement("canvas");
    atlasCanvas.width = atlasCols * glyphPx;
    atlasCanvas.height = atlasRows * glyphPx;
    const aCtx = atlasCanvas.getContext("2d");
    aCtx.fillStyle = "rgba(0,0,0,0)";
    aCtx.fillRect(0, 0, atlasCanvas.width, atlasCanvas.height);

    // draw glyphs centered in each cell
    aCtx.textAlign = "center";
    aCtx.textBaseline = "middle";
    aCtx.font = `${glyphPx * 0.9}px "IBM Plex Mono", ui-monospace, monospace`;
    for (let i = 0; i < glyphCount; i++) {
      const col = i % atlasCols;
      const row = Math.floor(i / atlasCols);
      const x = col * glyphPx + glyphPx / 2;
      const y = row * glyphPx + glyphPx / 2;
      // head glyph bright green
      aCtx.fillStyle = `hsl(${hue}, 100%, 65%)`;
      aCtx.fillText(chars[i], x, y);
    }

    const atlasTex = new THREE.CanvasTexture(atlasCanvas);
    atlasTex.minFilter = THREE.LinearFilter;
    atlasTex.magFilter = THREE.LinearFilter;
    atlasTex.wrapS = atlasTex.wrapT = THREE.ClampToEdgeWrapping;

    // geometry (plane)
    const plane = new THREE.PlaneGeometry(1, 1 * (glyphPx / glyphPx)); // keep square
    // We'll supply instance attributes: translation, scale, glyphIndex, hueShift, speedOffset
    const instMesh = new THREE.InstancedMesh(plane, null, instanceCount);

    // prepare instanced attributes arrays
    const translations = new Float32Array(instanceCount * 3);
    const glyphIndex = new Float32Array(instanceCount);
    const scaleArr = new Float32Array(instanceCount);
    const speedOff = new Float32Array(instanceCount);
    const baseHue = new Float32Array(instanceCount);

    // world extents (horizontal spread)
    const aspect = mount.clientWidth / mount.clientHeight;
    const worldW = 12 * aspect; // tweak for coverage
    const worldH = 10;

    let k = 0;
    for (let c = 0; c < columns; c++) {
      const x = (c / (columns - 1) - 0.5) * worldW;
      for (let r = 0; r < rowsVisible; r++) {
        for (let d = 0; d < depthLayers; d++) {
          const idx = k;
          // spread Y vertically with some jitter
          const y =
            (r / (rowsVisible - 1) - 0.5) * worldH +
            (Math.random() - 0.5) * 0.6;
          // Z distribution: further back means larger negative z
          const z = -(d * 2 + Math.random() * 1.8) - Math.random() * 6;
          translations[idx * 3 + 0] = x;
          translations[idx * 3 + 1] = y;
          translations[idx * 3 + 2] = z;

          glyphIndex[idx] = Math.floor(Math.random() * glyphCount);
          scaleArr[idx] = 0.9 + Math.random() * 0.7;
          speedOff[idx] = Math.random() * 0.6;
          baseHue[idx] = (hue + (Math.random() * 18 - 9)) / 360.0;

          k++;
        }
      }
    }

    // custom shader
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        atlas: { value: atlasTex },
        atlasCols: { value: atlasCols },
        atlasRows: { value: atlasRows },
        opacity: { value: opacity },
        time: { value: 0.0 },
      },
      vertexShader: `
        attribute vec3 instanceTranslation;
        attribute float instanceScale;
        attribute float instanceGlyph;
        varying float vGlyph;
        varying vec2 vUv;
        uniform float time;
        void main() {
          vGlyph = instanceGlyph;
          vUv = uv;
          vec3 pos = position * instanceScale;
          // instanceTranslation holds x,y,z world pos
          vec4 worldPosition = modelMatrix * vec4(pos + instanceTranslation, 1.0);
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
  precision mediump float;
  uniform sampler2D atlas;
  uniform float atlasCols;
  uniform float atlasRows;
  uniform float opacity;
  varying float vGlyph;
  varying vec2 vUv;
  void main() {
    // compute glyph cell
    float gi = floor(vGlyph + 0.5);
    float col = mod(gi, atlasCols);
    float row = floor(gi / atlasCols);
    vec2 cellSize = vec2(1.0 / atlasCols, 1.0 / atlasRows);

    // UV inside atlas
    vec2 aUV = vUv * cellSize + vec2(col * cellSize.x, row * cellSize.y);

    // ⚠️ 'sample' is reserved → use 'tex'
    vec4 tex = texture2D(atlas, aUV);

    float alpha = tex.a;
    gl_FragColor = vec4(tex.rgb, alpha * opacity);
    if (gl_FragColor.a < 0.02) discard;
  }
`,

      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    // attach attributes
    instMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    // create buffers for the custom attributes
    const instTranslationsAttr = new THREE.InstancedBufferAttribute(
      translations,
      3
    );
    const instGlyphAttr = new THREE.InstancedBufferAttribute(glyphIndex, 1);
    const instScaleAttr = new THREE.InstancedBufferAttribute(scaleArr, 1);
    const instSpeedOffAttr = new THREE.InstancedBufferAttribute(speedOff, 1);
    const instBaseHueAttr = new THREE.InstancedBufferAttribute(baseHue, 1);

    // assign attributes to geometry (plane)
    plane.setAttribute("instanceTranslation", instTranslationsAttr);
    plane.setAttribute("instanceGlyph", instGlyphAttr);
    plane.setAttribute("instanceScale", instScaleAttr);
    plane.setAttribute("instanceSpeedOff", instSpeedOffAttr);
    plane.setAttribute("instanceBaseHue", instBaseHueAttr);

    instMesh.material = mat;
    instMesh.count = instanceCount;
    scene.add(instMesh);

    // helper arrays for runtime state of each instance
    const state = new Float32Array(instanceCount * 3); // x,y,z updatable
    for (let i = 0; i < instanceCount; i++) {
      state[i * 3 + 0] = translations[i * 3 + 0];
      state[i * 3 + 1] = translations[i * 3 + 1];
      state[i * 3 + 2] = translations[i * 3 + 2];
    }

    // make a reusable object for instance matrix
    const dummy = new THREE.Object3D();

    // Mouse-linked parallax — read CSS vars from RootMatrixBG if present
    const rootEl = document.documentElement;
    const readVar = (name, fallback) => {
      const v = getComputedStyle(rootEl).getPropertyValue(name).trim();
      return v ? parseFloat(v) : fallback;
    };

    let lastTime = performance.now();

    function animate(t) {
      const dt = (t - lastTime) / 1000;
      lastTime = t;

      // update time uniform
      mat.uniforms.time.value += dt;

      // update instance positions: move z forward (toward camera) and cycle
      for (let i = 0; i < instanceCount; i++) {
        const si = i * 3;
        // speed per instance
        const spd = 1.2 * speed * (0.6 + speedOff[i]);
        let z = state[si + 2] + spd * dt * 1.6;
        // small vertical wobble for ripple feel
        const wob = Math.sin((mat.uniforms.time.value + i * 0.1) * 1.5) * 0.02;

        // when instance passes camera z > some threshold, send it back far
        if (z > 2.5) {
          z = -(6 + Math.random() * 8);
          // optionally pick a new glyph
          const gi = Math.floor(Math.random() * glyphCount);

          plane.attributes.instanceGlyph.array[i] = gi;
          plane.attributes.instanceGlyph.needsUpdate = true;
        }

        state[si + 2] = z;

        dummy.position.set(state[si + 0], state[si + 1] + wob, state[si + 2]);
        dummy.scale.set(scaleArr[i], scaleArr[i], 1);
        dummy.updateMatrix();
        instMesh.setMatrixAt(i, dummy.matrix);
      }

      instMesh.instanceMatrix.needsUpdate = true;

      // optional lightweight parallax: read CSS vars set by RootMatrixBG
      const mxX = parseFloat(
        getComputedStyle(rootEl).getPropertyValue("--mx-mlx1") || "0"
      );
      const mxY = parseFloat(
        getComputedStyle(rootEl).getPropertyValue("--mx-mly1") || "0"
      );
      scene.position.x = mxX * 0.02;
      scene.position.y = mxY * 0.02;

      renderer.render(scene, camera);
      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);

    // resize observer
    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // cleanup
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      atlasTex.dispose();
      mat.dispose();
      instMesh.geometry.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [density, speed, opacity, hue]);

  return (
    <div
      ref={mountRef}
      className={className}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
