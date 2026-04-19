"use client";

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, ContactShadows, Float, Box, Sphere } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

function InnerSphere() {
  return (
    <Sphere args={[0.6, 64, 64]}>
      <meshPhysicalMaterial 
        color="#ff4488"
        metalness={1}
        roughness={0.15}
      />
    </Sphere>
  );
}

function GlassCube() {
  const meshRef = useRef<THREE.Mesh>(null);
  const targetRotation = useRef({ x: 0, y: 0 });
  
  // Smoothly rotate to mouse position + idle rotation
  useFrame((state) => {
    if (!meshRef.current) return;
    
    // Base idle rotation
    meshRef.current.rotation.y += 0.003;
    meshRef.current.rotation.x += 0.001;

    // Additional hover-driven rotation mapping
    targetRotation.current.x = (state.pointer.y * Math.PI) / 4;
    targetRotation.current.y = (state.pointer.x * Math.PI) / 4;

    // Apply with lerp for smoothness
    meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, meshRef.current.rotation.x - targetRotation.current.x * 0.1, 0.05);
    meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, meshRef.current.rotation.y + targetRotation.current.y * 0.1, 0.05);
  });

  return (
    <Float floatIntensity={1.5} speed={2}>
      <mesh ref={meshRef}>
        <boxGeometry args={[1.8, 1.8, 1.8]} />
        <meshPhysicalMaterial 
          transmission={1}
          thickness={1.5}
          roughness={0.05}
          ior={1.5}
          clearcoat={1}
          clearcoatRoughness={0.1}
          color="#ffffff"
          envMapIntensity={1.5}
        />
        <InnerSphere />
        
        {/* Neon Edge Lights inside/near the cube for refraction */}
        <pointLight position={[1.2, 1.2, 1.2]} color="#ff3333" intensity={2.5} distance={4} />
        <pointLight position={[-1.2, -1.2, 1.2]} color="#00ffcc" intensity={2.5} distance={4} />
        <pointLight position={[1.2, -1.2, -1.2]} color="#ffcc00" intensity={2} distance={4} />
      </mesh>
    </Float>
  );
}

export default function CrystalCube() {
  return (
    <div className="absolute inset-0 w-full h-full" style={{ zIndex: 10, pointerEvents: 'none' }}>
      <Canvas 
        camera={{ position: [0, 1.5, 6.5], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ pointerEvents: 'auto' }}
      >
        <ambientLight intensity={0.2} />
        <Environment files="/dikhololo_night_1k.hdr" />
        
        <GlassCube />
        
        <ContactShadows 
          position={[0, -2.5, 0]} 
          opacity={0.5} 
          scale={15} 
          blur={3} 
          far={5} 
          color="#000000"
        />

        <EffectComposer>
          <Bloom luminanceThreshold={0.4} mipmapBlur intensity={1.2} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
