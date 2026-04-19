"use client";

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Float, Sphere } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

/**
 * Programmatic cube-map environment — no external HDRI fetch needed.
 * This avoids all CSP / network issues while still providing a rich
 * reflective environment for the glass material.
 */
function LocalEnvironment() {
  const cubeMap = useMemo(() => {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const faces: THREE.Texture[] = [];
    const faceColors: [string, string][] = [
      ['#0a0018', '#1a0030'], // +X
      ['#050010', '#120028'], // -X
      ['#0d001a', '#1f0040'], // +Y (top — slightly brighter)
      ['#030008', '#080015'], // -Y (bottom — dark)
      ['#08001a', '#150030'], // +Z
      ['#060012', '#100025'], // -Z
    ];

    for (const [c1, c2] of faceColors) {
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

      const tex = new THREE.CanvasTexture(canvas);
      tex.needsUpdate = true;
      faces.push(tex.clone());
    }

    const cubeTexture = new THREE.CubeTexture(faces.map(t => t.image as HTMLCanvasElement));
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
          transparent={true}
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
        
        {/* Programmatic local env map — no external HDRI fetch, no CSP issues */}
        <LocalEnvironment />
        
        {/* Key + fill lights to compensate for no HDRI */}
        <directionalLight position={[5, 5, 5]} intensity={0.8} color="#c8b0ff" />
        <directionalLight position={[-3, 2, -4]} intensity={0.4} color="#4488ff" />
        
        <GlassCube />
        
        {/* Render shadows only once to avoid massive GPU overhead that causes Context Lost */}
        <ContactShadows 
          position={[0, -2.5, 0]} 
          opacity={0.5} 
          scale={15} 
          blur={3} 
          far={5} 
          color="#000000"
          frames={1}
        />

        <EffectComposer>
          <Bloom luminanceThreshold={0.4} mipmapBlur={false} intensity={1.2} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
