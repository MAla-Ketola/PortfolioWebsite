import RisingIcon from "./RisingIcon";

const COLORS = ["#9b5cff", "#00e5ff", "#ff66c4", "#61dafb", "#ffd166", "#a6ff00"];

export default function RisingIconsCloud({
  icons = ["/icons/code-bracket.svg", "/icons/sparkles.svg", "/icons/command-line.svg"],
  count = 24,
  xSpread = 8,
  zSpread = 6,
  scale = 0.05,
  ...props
}) {
  // Generate random icon configs
  const items = Array.from({ length: count }, (_, i) => {
    const url = icons[i % icons.length];
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const hueShiftSpeed = Math.random() < 0.35 ? (0.4 + Math.random() * 0.6) : 0;
    return {
      url,
      color,
      hueShiftSpeed,
      x: (Math.random() - 0.5) * xSpread,
      z: (Math.random() - 0.5) * zSpread,
      speed: 0.006 + Math.random() * 0.010,
      scale: 0.4 + Math.random() * 0.3,
      key: i,
    };
  });

  return (
    <group>
      {items.map((item) => (
        <RisingIcon {...item} key={item.key} />
      ))}
    </group>
  );
}