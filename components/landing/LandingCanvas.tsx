"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import MolecularScene from "./MolecularScene";
import Hero3DElements from "./Hero3DElements";

interface LandingCanvasProps {
  scrollProgress: number;
}

export default function LandingCanvas({ scrollProgress }: LandingCanvasProps) {
  return (
    <div className="landing-canvas-container">
      <Suspense fallback={null}>
        <Canvas 
          dpr={[1, 1.5]} 
          camera={{ position: [0, 0, 8], fov: 50 }} 
          gl={{ antialias: true, alpha: true }}
        >
          <MolecularScene />
          <Hero3DElements scrollProgress={scrollProgress} />
        </Canvas>
      </Suspense>
    </div>
  );
}
