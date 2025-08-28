import { useMemo } from "react";
import RisingIcon from "./RisingIcon";

/** Tiny seeded RNG so layout stays stable across renders */
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function RisingIconsCloud({ config = {}, ...groupProps }) {
  const {
    // icons & colors
    icons = [
      "/icons/code-bracket.svg",
      "/icons/sparkles.svg",
      "/icons/command-line.svg",
    ],
    colors = ["#ff66c4" ],

    // counts & area
    count = 24,
    xSpread = 8,
    zSpread = 6,
    centerX = 0,
    centerZ = 0,

    // swirl
    swirlRadius = 5,
    swirlSpeed = 0.1,

    // vertical motion
    startY = -4,
    endY = 6,
    speedMin = 0.006,
    speedMax = 0.01,

    // base scale (before pulse)
    itemScaleMin = 0.4,
    itemScaleMax = 0.7,

    // pulse
    pulseAmount = 0.4,
    pulseSpeed = 2.0,

    // hue shift
    hueShiftChance = 0.35,
    hueShiftSpeedMin = 0.4,
    hueShiftSpeedMax = 1.0,

    // stable layout
    seed = 1234,
  } = config;

  const items = useMemo(() => {
    const rnd = mulberry32(seed);
    const arr = Array.from({ length: count }, (_, i) => {
      const url = icons[i % icons.length];
      const color = colors[Math.floor(rnd() * colors.length)];

      const hueShiftSpeed =
        rnd() < hueShiftChance
          ? hueShiftSpeedMin + rnd() * (hueShiftSpeedMax - hueShiftSpeedMin)
          : 0;

      return {
        key: i,
        url,
        color,
        hueShiftSpeed,

        // base offsets around a center to help aligning with the computer
        // when creating items
        baseX: centerX + (rnd() - 0.5) * xSpread,
        baseZ: centerZ + (rnd() - 0.5) * zSpread,

        // motion
        startY,
        endY,
        speed: speedMin + rnd() * (speedMax - speedMin),

        // scale (RisingIcon scales the whole group)
        scale: itemScaleMin + rnd() * (itemScaleMax - itemScaleMin),
      };
    });
    return arr;
  }, [
    count,
    icons,
    colors,
    xSpread,
    zSpread,
    centerX,
    centerZ,
    swirlRadius,
    swirlSpeed,
    startY,
    endY,
    speedMin,
    speedMax,
    itemScaleMin,
    itemScaleMax,
    hueShiftChance,
    hueShiftSpeedMin,
    hueShiftSpeedMax,
    seed,
  ]);

  return (
    <group {...groupProps}>
      {items.map((item) => (
        <RisingIcon
          key={item.key}
          url={item.url}
          color={item.color}
          hueShiftSpeed={item.hueShiftSpeed}
          baseX={item.baseX}
          baseZ={item.baseZ}
          startY={item.startY}
          endY={item.endY}
          speed={item.speed}
          scale={item.scale}
          swirlRadius={swirlRadius}
          swirlSpeed={swirlSpeed}
          pulseAmount={pulseAmount}
          pulseSpeed={pulseSpeed}
        />
      ))}
    </group>
  );
}
