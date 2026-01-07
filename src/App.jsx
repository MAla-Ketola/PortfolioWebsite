import React, { useRef } from "react";
import { BrowserRouter } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { View } from "@react-three/drei";
import {
  About,
  Contact,
  Experience,
  Navbar,
  Works,
  Hero,
} from "./components";

const App = () => {
  const mainRef = useRef(null);

  return (
    <BrowserRouter>
      {/* 1. The Main Scroll Container 
        We ref this so the 3D Canvas knows where "scrolling" happens.
      */}
      <div
        ref={mainRef}
        className="relative w-full h-screen overflow-y-auto overflow-x-hidden bg-paper text-primary selection:bg-bento-pink selection:text-primary"
      >
        <Navbar />

        {/* 2. The Global 3D Layer 
           This sits *behind* the HTML but *listens* to the HTML container.
           pointer-events-none ensures clicks pass through to buttons, 
           but eventSource={mainRef} allows 3D objects to still react to hover!
        */}
        <Canvas
          className="!fixed inset-0 top-0 left-0 z-0 pointer-events-none"
          eventSource={mainRef}
          style={{ position: "fixed" }} // Safety style
        >
          {/* This renders all the <View> contents from other components */}
          <View.Port />
        </Canvas>

        {/* 3. The Content Layer (HTML) */}
        <div className="relative z-10">
          <Hero />
          
          {/* Placeholder sections for now */}
          <div className="bg-paper">
            <About />
            <Works />
            <Experience />
            <Contact />
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;
