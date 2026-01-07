// src/components/case-studies/ali-ketola/shared/ui.jsx
import React from "react";
import { styles } from "/src/styles";
import { TypeTitle, ScrambleText } from "./SectionTitleStyles";
import { EDGE, DIVIDE, SOFT, NEAR } from "../content";


export const CTAButton = ({
  href,
  onClick,
  children,
  label,
  target = "_blank",
  className = "",
}) => {
  const Comp = href ? "a" : "button";

  const style = {
    border: `1px solid ${EDGE}`,
    backgroundColor: "rgba(178,90,255,0.18)",
    color: "rgba(232,240,255,0.95)",
    boxShadow: "0 0 20px rgba(178,90,255,.15)",
  };

  const onEnter = (e) =>
    (e.currentTarget.style.backgroundColor = "rgba(178,90,255,0.10)");
  const onLeave = (e) =>
    (e.currentTarget.style.backgroundColor = "rgba(178,90,255,0.18)");

  return (
    <Comp
      href={href}
      onClick={onClick}
      aria-label={label}
      target={target}
      rel={target === "_blank" ? "noopener noreferrer" : undefined}
      style={style}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className={`inline-flex items-center gap-2 rounded-none px-5 py-2.5 font-mono font-bold focus:outline-none focus:ring-2 ${className}`}
    >
      {children}
    </Comp>
  );
};

export function Panel({ title, right, children, className = "", pad = true, style = {} }) {
  return (
    <div
      className={[
        "bg-black/50 md:backdrop-blur-sm overflow-hidden flex flex-col shadow-[0_0_40px_rgba(178,90,255,0.08)] border rounded-none panel",
        className,
      ].join(" ")}
      style={{ borderColor: "var(--accent, rgba(178,90,255,0.30))", ...style }}
    >
      {title && (
        <div
          className="flex items-center gap-2 px-3 py-2 border-b text-xs"
          style={{
            borderBottomColor: "var(--divide, rgba(178,90,255,0.25))",
            color: "var(--accent, rgba(178,90,255,0.90))",
          }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: "var(--accent, rgba(178,90,255,0.85))",
              boxShadow: "0 0 10px var(--accent, rgba(178,90,255,0.6))",
            }}
          />
          <span className="uppercase tracking-widest">{title}</span>
          <div className="ml-auto">{right}</div>
        </div>
      )}
      <div className={pad ? "p-4 md:p-5" : ""}>{children}</div>
    </div>
  );
}

export function Chip({ children }) {
  return (
    <span
      className="text-[13px] px-2.5 py-1 border"
      style={{
        borderColor: "var(--accent, rgba(178,90,255,0.30))",
        backgroundColor: "var(--soft, rgba(178,90,255,0.06))",
        color: "rgba(232,240,255,0.92)",
      }}
    >
      #{children}
    </span>
  );
}

export function Stat({ label, value, note }) {
  return (
    <div className="flex items-baseline gap-3">
      <div className="text-2xl md:text-3xl font-semibold text-white/95 tracking-tight">{value}</div>
      <div className="font-mono text-[13px] text-white/80">
        {label}
        {note ? <span className="ml-2 text-[12px] text-white/60">{note}</span> : null}
      </div>
    </div>
  );
}

export function SectionHeader({ label, title }) {
  return (
    <div>
      <p className={`${styles.sectionSubText}`}>
        <TypeTitle text={label} duration={650} delay={50} />
      </p>
      <h2 className={`${styles.sectionHeadText}`}>
        <span className="hud-h2">
          <ScrambleText text={title} duration={450} />
        </span>
      </h2>
    </div>
  );
}

/** Optional: shared StepNav so the container can import it */
export function StepNav() {
  const steps = [
    { id: "define", label: "DEFINE" },
    { id: "ideate", label: "IDEATE" },
    { id: "prototype", label: "PROTOTYPE" },
    { id: "implement", label: "IMPLEMENT" },
    { id: "validate", label: "VALIDATE" },
  ];
  return (
    <div className="mt-6 grid grid-cols-2 min-[560px]:grid-cols-5 gap-2">
      {steps.map((s) => (
        <a key={s.id} href={`#${s.id}`} className="group">
          <Panel title={`/${s.label.toLowerCase()}`}>
            <div className="font-mono text-sm text-white/90">{s.label}</div>
          </Panel>
        </a>
      ))}
    </div>
  );
}
