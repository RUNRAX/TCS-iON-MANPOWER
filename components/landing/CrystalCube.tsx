"use client";

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Float, Sphere } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Programmatic cube-map environment — no external HDRI fetch needed.
 * Each face gets its own canvas to avoid the single-canvas overwrite bug.
 */
function LocalEnvironment() {
  const cubeMap = useMemo(() => {
    const size = 64;
    const faceColors: [string, string][] = [
      ['#0a0018', '#1a0030'], // +X
      ['#050010', '#120028'], // -X
      ['#0d001a', '#1f0040'], // +Y (top — slightly brighter)
      ['#030008', '#080015'], // -Y (bottom — dark)
      ['#08001a', '#150030'], // +Z
      ['#060012', '#100025'], // -Z
    ];

    const canvases: HTMLCanvasElement[] = [];

    for (const [c1, c2] of faceColors) {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      const gradient = ctx.createLinearGradient(0, 0, 0, size);
      gradient.addColorStop(0, c1);
      gradient.addColorStop(1, c2);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);

      // Add subtle noise dots for realism
      for (let i = 0; i < 30; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const a = Math.random() * 0.15 + 0.03;
        ctx.fillStyle = `rgba(180,140,255,${a})`;
        ctx.fillRect(x, y, 1, 1);
      }

      canvases.push(canvas);
    }

    const cubeTexture = new THREE.CubeTexture(canvases);
    cubeTexture.needsUpdate = true;
    return cubeTexture;
  }, []);

  return <primitive object={cubeMap} attach="environment" />;
}

function InnerSphere() {
  return (
    <Sphere args={[0.6, 64, 64]}>
      <meshPhysicalMaterial 
        color="#ff4488"
        emissive="#ff2266"
        emissiveIntensity={0.3}
        metalness={1}
        roughness={0.15}
      />
    </Sphere>
  );
}

function GlassCube() {
  const meshRef = useRef<THREE.Mesh>(null);
  const targetRotation = useRef({ x: 0, y: 0 });
  
  useFrame((state) => {
    if (!meshRef.current) return;
    
    // Base idle rotation
    meshRef.current.rotation.y += 0.003;
    meshRef.current.rotation.x += 0.001;

    // Hover-driven rotation
    targetRotation.current.x = (state.pointer.y * Math.PI) / 4;
    targetRotation.current.y = (state.pointer.x * Math.PI) / 4;

    meshRef.current.rotation.x = THREE.MathUtils.lerp(
      meshRef.current.rotation.x,
      meshRef.current.rotation.x - targetRotation.current.x * 0.1,
      0.05
    );
    meshRef.current.rotation.y = THREE.MathUtils.lerp(
      meshRef.current.rotation.y,
      meshRef.current.rotation.y + targetRotation.current.y * 0.1,
      0.05
    );
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
          transparent={true}
        />
        <InnerSphere />
        
        {/* Neon Edge Lights — boosted intensity to compensate for removed Bloom */}
        <pointLight position={[1.2, 1.2, 1.2]} color="#ff3333" intensity={4} distance={5} />
        <pointLight position={[-1.2, -1.2, 1.2]} color="#00ffcc" intensity={4} distance={5} />
        <pointLight position={[1.2, -1.2, -1.2]} color="#ffcc00" intensity={3} distance={5} />
      </mesh>
    </Float>
  );
}

export default function CrystalCube() {
  return (
    <div className="absolute inset-0 w-full h-full" style={{ zIndex: 10, pointerEvents: 'none' }}>
      <Canvas 
        camera={{ position: [0, 1.5, 6.5], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: 'default',
          // Limit pixel ratio to reduce GPU load and prevent context loss
        }}
        style={{ pointerEvents: 'auto' }}
        // Recover from context loss instead of crashing
        onCreated={({ gl }) => {
          const canvas = gl.domElement;
          canvas.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            console.warn('WebGL context lost — will attempt restore');
          });
          canvas.addEventListener('webglcontextrestored', () => {
            console.info('WebGL context restored');
          });
        }}
      >
        <ambientLight intensity={0.3} />
        
        {/* Programmatic local env map — no external HDRI fetch, no CSP issues */}
        <LocalEnvironment />
        
        {/* Key + fill lights */}
        <directionalLight position={[5, 5, 5]} intensity={1} color="#c8b0ff" />
        <directionalLight position={[-3, 2, -4]} intensity={0.5} color="#4488ff" />
        
        <GlassCube />
        
        {/* Render shadows once to avoid GPU overhead */}
        <ContactShadows 
          position={[0, -2.5, 0]} 
          opacity={0.5} 
          scale={15} 
          blur={3} 
          far={5} 
          color="#000000"
          frames={1}
        />

        {/* 
          EffectComposer/Bloom REMOVED — it causes:
          "Cannot read properties of undefined (reading 'length')"
          due to @react-three/postprocessing v3 incompatibility with Three.js 0.184.
          Glow is now achieved via boosted point-light intensities and emissive materials.
        */}
      </Canvas>
    </div>
  );
}
