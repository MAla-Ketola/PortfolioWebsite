// src/pages/AliKetolaPage.jsx
import React from "react";
import AliKetola from "../components/ali-ketola/AliKetola";

export default function AliKetolaPage() {
  return (
    <main className="relative z-10 pt-24 pb-16 px-4 sm:px-6">
      {/* Top padding so the fixed Navbar doesn't overlap the title */}
      <AliKetola />
    </main>
  );
}
