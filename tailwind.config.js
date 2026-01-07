/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  mode: "jit",
  theme: {
    extend: {
      fontFamily: {
        mono: [
          '"IBM Plex Mono"',
          "monospace",
        ],
        sans: ["Karla", "system-ui", "sans-serif"],
        serif: ["Playfair Display", "serif"],
      },
      colors: {
        primary: "#1a1a1a", 
        paper: "#fdfbf7",   // Global background (Warm White)
        
        // Your Roadmap Palette
        "bento-pink": "#F8C8DC",  // Hero & Contact
        "bento-mint": "#C1E1C1",  // About Me
        "bento-blue": "#BDE0FE",  // Projects
        "bento-deep": "#A2D2FF",  // Experience
        "bento-cream": "#FEF9E7", // Toolbelt
        
        // UI
        surface: "#ffffff", 
        border: "#1a1a1a",
      },
      borderWidth: {
        DEFAULT: "1.5px",
      },
      backgroundImage: {
        "grid-pattern": "linear-gradient(to right, #f0f0f0 1px, transparent 1px), linear-gradient(to bottom, #f0f0f0 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};
