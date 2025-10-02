// Navbar.jsx — mono + magenta, square corners, progress hairline
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { styles } from "../styles";
import { navLinks } from "../constants";
import { menu, close } from "../assets";
import logo1 from "../assets/logo1.png";

const ACCENT = "#B25AFF";

const Navbar = () => {
  const [toggle, setToggle] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const barRef = useRef(null);

  // Elevation + progress hairline
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || 0;
      const doc = document.documentElement;
      const h = doc.scrollHeight - doc.clientHeight;

      setScrolled(y > 12);
      setProgress(h > 0 ? Math.min(100, Math.max(0, (y / h) * 100)) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Close mobile menu on hash change and Esc
  useEffect(() => {
    const onHash = () => setToggle(false);
    const onKey = (e) => e.key === "Escape" && setToggle(false);
    window.addEventListener("hashchange", onHash);
    if (toggle) window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("keydown", onKey);
    };
  }, [toggle]);

  const barClass =
    "relative mt-3 px-4 sm:px-6 " +
    (scrolled
      ? "border bg-black/80 backdrop-blur-xl"
      : "border bg-black/55 backdrop-blur-md");

  return (
    <nav className="fixed top-0 left-0 w-full z-50">
      {/* Skip link (square corners) */}
      <a
        href="#hero"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 font-mono text-[13px]
                   border px-3 py-1 bg-black/85"
        style={{ color: ACCENT, borderColor: ACCENT }}
      >
        Skip to content
      </a>

      <div className={`mx-auto max-w-7xl ${styles.paddingX}`}>
        <div
          ref={barRef}
          className={barClass}
          style={{
            borderColor: `${ACCENT}66`, // /40
            boxShadow: scrolled
              ? `0 10px 40px ${ACCENT}2E`
              : `0 0 40px ${ACCENT}14`,
          }}
        >
          {/* progress hairline */}
          <div
            className="absolute left-0 top-0 h-[2px] transition-[width] duration-150"
            style={{
              width: `${progress}%`,
              background: ACCENT,
              boxShadow: `0 0 10px ${ACCENT}B3`,
            }}
            aria-hidden="true"
          />
          {/* bottom separator glow */}
          <div
            className="pointer-events-none absolute inset-x-2 -bottom-px h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(178,90,255,.5), transparent)",
            }}
            aria-hidden="true"
          />

          <div className="flex h-16 items-center justify-between">
            {/* Brand */}
            <Link
              to="/"
              className="flex items-center gap-3"
              onClick={() => window.scrollTo(0, 0)}
            >
  {/*             <img
                src={logo1}
                alt="logo"
                className="w-10 h-10 object-contain"
              /> */}
              <div className="hidden sm:flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: ACCENT,
                    boxShadow: `0 0 10px ${ACCENT}CC`,
                  }}
                />
                <span
                  className="uppercase tracking-widest text-[11px] font-mono text-zinc-300/90"
                  style={{
                    color: "rgba(178, 90, 255, 0.9)",
                  }}
                >
                  /home/marjut
                </span>
              </div>
            </Link>

            {/* Desktop nav */}
            <ul className="hidden sm:flex items-center gap-6">
              {navLinks.map((link) => (
                <li key={link.id} className="relative">
                  <a
                    href={`#${link.id}`}
                    className="font-mono text-sm px-2 py-1 text-zinc-300/85 hover:text-white transition-colors"
                    style={{}}
                  >
                    {link.title}
                  </a>
                  {/* underline intentionally removed */}
                </li>
              ))}
            </ul>

            {/* Mobile toggle (square corners) */}
            <button
              aria-label="Toggle menu"
              onClick={() => setToggle((t) => !t)}
              className="sm:hidden inline-flex items-center justify-center p-2"
              style={{
                border: `1px solid ${ACCENT}66`,
                backgroundColor: `${ACCENT}1A`,
                color: "#E5E7EB",
              }}
            >
              <img src={toggle ? close : menu} alt="" className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile terminal menu (square corners) */}
        <div
          className={`sm:hidden transition-all duration-200 ${
            toggle
              ? "opacity-100 translate-y-0"
              : "pointer-events-none opacity-0 -translate-y-2"
          }`}
        >
          <div
            className="mx-2 mt-2 border bg-black/80 backdrop-blur-xl"
            style={{
              borderColor: `${ACCENT}40`,
              boxShadow: `0 0 40px ${ACCENT}1F`,
            }}
          >
            <div
              className="flex items-center gap-2 px-3 py-2 border-b"
              style={{ borderBottomColor: `${ACCENT}40` }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: ACCENT,
                  boxShadow: `0 0 10px ${ACCENT}CC`,
                }}
              />
              <span className="uppercase tracking-widest text-[11px] font-mono text-zinc-300/90">
                /bin/menu
              </span>
              <span className="ml-auto font-mono text-[11px] text-zinc-400">
                Esc to close
              </span>
            </div>

            <ul className="p-3 flex flex-col gap-1">
              {navLinks.map((link) => (
                <li key={link.id}>
                  <a
                    href={`#${link.id}`}
                    onClick={() => setToggle(false)}
                    className="block px-3 py-2 font-mono text-sm text-zinc-300/85 hover:text-white transition-colors"
                    style={{ backgroundColor: "transparent" }}
                  >
                    ▸ <span className="hover:text-[inherit]">{link.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
