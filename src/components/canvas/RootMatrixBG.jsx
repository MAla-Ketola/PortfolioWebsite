// RootMatrixBG.jsx — minimal wrapper for the new 3D MatrixBG
// RootMatrixBG.jsx — minimal wrapper for the new 3D MatrixBG
import React from "react";
import MatrixBG from "./MatrixBG";

export default function RootMatrixBG() {
  return (
    <div
      className="fixed inset-0 -z-50 pointer-events-none"
      aria-hidden="true"
    >
      {/* You can tweak these props from here if you like */}
      <MatrixBG density={1.2} speed={1.2} glow={0.6} opacity={1} className="absolute inset-0" />
    </div>
  );
}

