"use client";

import React, { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Float, MeshTransmissionMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useTheme } from "@/lib/context/ThemeContext";

export default function Hero3DElements({ scrollProgress = 0 }: { scrollProgress?: number }) {
  const { dark } = useTheme();
  const torusRef = useRef<THREE.Mesh>(null);
  const icosaRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const { pointer } = useThree();

  // Smoothing targets
  const targetRotX = useRef(0);
  const targetRotY = useRef(0);

  // Premium Gold Material definition to reuse
  const GlassGoldMaterial = () => (
    <MeshTransmissionMaterial
      samples={6}
      resolution={512}
      thickness={1}
      roughness={0.1}
      anisotropy={1}
      chromaticAberration={0.05}
      clearcoat={1}
      clearcoatRoughness={0.1}
      color={dark ? "#ffffff" : "#fdf6e3"}
      emissive="#D4AF37"
      emissiveIntensity={dark ? 0.5 : 0.2}
      envMapIntensity={2.5}
    />
  );

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Smooth spring physics for pointer tracking
    targetRotX.current = THREE.MathUtils.lerp(targetRotX.current, (pointer.y * Math.PI) / 8, 0.1);
    targetRotY.current = THREE.MathUtils.lerp(targetRotY.current, (pointer.x * Math.PI) / 8, 0.1);

    groupRef.current.rotation.x = targetRotX.current;
    groupRef.current.rotation.y = targetRotY.current;

    // Continuous slow rotations for inner objects
    if (torusRef.current) {
      torusRef.current.rotation.z -= delta * 0.2;
      torusRef.current.rotation.x += delta * 0.1;
    }
    
    if (icosaRef.current) {
      icosaRef.current.rotation.y += delta * 0.3;
      icosaRef.current.rotation.z += delta * 0.15;
    }
    
    // Scroll reactivity (slide and rotate)
    const fadeY = scrollProgress * 3;
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, fadeY, 0.05);
  });

  return (
    <group ref={groupRef} position={[2.5, 0, 0]} scale={[1.2, 1.2, 1.2]}>
      {/* Torus Knot (Complex intersecting shape) */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1} floatingRange={[-0.2, 0.2]}>
        <mesh ref={torusRef} position={[-0.5, 0.5, 1]} scale={0.8}>
          <torusKnotGeometry args={[0.8, 0.25, 128, 32]} />
          <GlassGoldMaterial />
        </mesh>
      </Float>

      {/* Icosahedron (Geometric crystal) */}
      <Float speed={2.5} rotationIntensity={1} floatIntensity={1.5} floatingRange={[-0.4, 0.4]}>
        <mesh ref={icosaRef} position={[1.5, -0.8, -0.5]} scale={1.1}>
          <icosahedronGeometry args={[0.7, 0]} />
          <MeshTransmissionMaterial
             samples={4}
             thickness={2}
             roughness={0.05}
             clearcoat={1}
             color="#ffffff"
             emissive="#f59e0b"
             emissiveIntensity={dark ? 0.8 : 0.4}
          />
        </mesh>
      </Float>
      
      {/* Connecting wireframe structure wrapping them */}
      <mesh position={[0.5, -0.2, 0.2]} scale={2.5}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color="#D4AF37" wireframe transparent opacity={0.15} />
      </mesh>
    </group>
  );
}
