"use client";

import React, { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MeshTransmissionMaterial, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { useTheme } from "@/lib/context/ThemeContext";

// Generate stable random node positions
function generateNodes(count: number, radius: number) {
  const nodes = [];
  for (let i = 0; i < count; i++) {
    // Distribute roughly on a sphere
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = radius * (0.5 + Math.random() * 0.5); // Spread within 0.5..1 * radius
    
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);
    
    // Add varying speeds and phases for organic bobbing
    const phase = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random() * 0.5;
    
    nodes.push({ startPos: new THREE.Vector3(x, y, z), phase, speed });
  }
  return nodes;
}

// Generate bonds between nearby nodes
function generateBonds(nodes: { startPos: THREE.Vector3 }[], maxDistance: number) {
  const bonds = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (nodes[i].startPos.distanceTo(nodes[j].startPos) < maxDistance) {
        bonds.push({ a: i, b: j });
      }
    }
  }
  return bonds;
}

export default function MolecularScene() {
  const { dark } = useTheme();
  const groupRef = useRef<THREE.Group>(null);
  const nodesRef = useRef<THREE.InstancedMesh>(null);
  const bondsRef = useRef<THREE.LineSegments>(null);
  const { pointer, viewport } = useThree();
  
  // Create static configuration
  const NODE_COUNT = 30;
  const RADIUS = 4;
  const MAX_BOND_DIST = 2.5;
  
  const { nodes, bonds, bondGeometry } = useMemo(() => {
    const generatedNodes = generateNodes(NODE_COUNT, RADIUS);
    
    // Add currentPos to nodes for bonds to reference
    const nodesWithCurrentPos = generatedNodes.map(n => ({
      ...n,
      currentPos: n.startPos.clone()
    }));
    
    const generatedBonds = generateBonds(generatedNodes, MAX_BOND_DIST);
    
    // Create base geometry for lines to prevent recreating arrays per frame
    const maxBonds = generatedBonds.length;
    const bondPositions = new Float32Array(maxBonds * 6); // 2 vertices per bond, 3 coords per vertex
    const bondGeo = new THREE.BufferGeometry();
    bondGeo.setAttribute("position", new THREE.BufferAttribute(bondPositions, 3));
    
    return { 
      nodes: nodesWithCurrentPos, 
      bonds: generatedBonds,
      bondGeometry: bondGeo
    };
  }, []);

  // Frame update loop
  useFrame((state, delta) => {
    if (!groupRef.current || !nodesRef.current || !bondsRef.current) return;
    
    const time = state.clock.getElapsedTime();
    const positions = bondsRef.current.geometry.attributes.position.array as Float32Array;
    
    // Smooth pointer tracking for parallax/magnetic effect
    // Convert normalized device space [-1, 1] to world space approximation
    const targetX = (pointer.x * viewport.width) / 4;
    const targetY = (pointer.y * viewport.height) / 4;

    // Rotate entire group slowly
    groupRef.current.rotation.y += delta * 0.05;
    groupRef.current.rotation.x = Math.sin(time * 0.2) * 0.1;
    
    // Matrix for updating instanced meshes
    const matrix = new THREE.Matrix4();
    const nodePos = new THREE.Vector3();
    const mousePos = new THREE.Vector3(targetX, targetY, 0);

    // Update nodes
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      nodePos.copy(node.startPos);
      
      // Organic flow
      nodePos.y += Math.sin(time * node.speed + node.phase) * 0.3;
      nodePos.x += Math.cos(time * node.speed * 0.8 + node.phase) * 0.2;
      
      // Repulsion/Attraction from mouse
      // Apply inverse transform of the group to mouse position so physics works correctly during rotation
      const localMouse = mousePos.clone().applyMatrix4(groupRef.current.matrixWorld.clone().invert());
      
      const distToMouse = nodePos.distanceTo(localMouse);
      if (distToMouse < 3) {
        // Subtle magnetic pull
        const force = (3 - distToMouse) * 0.1;
        const dir = localMouse.clone().sub(nodePos).normalize();
        nodePos.add(dir.multiplyScalar(force));
      }
      
      matrix.setPosition(nodePos);
      nodesRef.current.setMatrixAt(i, matrix);
      
      // We also need to store current position for bond lines
      node.currentPos = nodePos.clone();
    }
    
    nodesRef.current.instanceMatrix.needsUpdate = true;
    
    // Update lines based on new node positions
    for (let i = 0; i < bonds.length; i++) {
      const bond = bonds[i];
      const posA = nodes[bond.a].currentPos!;
      const posB = nodes[bond.b].currentPos!;
      
      positions[i * 6] = posA.x;
      positions[i * 6 + 1] = posA.y;
      positions[i * 6 + 2] = posA.z;
      
      positions[i * 6 + 3] = posB.x;
      positions[i * 6 + 4] = posB.y;
      positions[i * 6 + 5] = posB.z;
    }
    bondsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  // Base colors
  const primaryGold = "#D4AF37"; // Rich metallic gold
  const emissiveGold = dark ? "#fbbf24" : "#f59e0b"; // 

  return (
    <group ref={groupRef}>
      {/* Procedural Environment Lighting (no external HDRI fetch) */}
      <hemisphereLight
        args={[
          dark ? "#1a1a2e" : "#f0e6d2",   // sky color
          dark ? "#0d0d1a" : "#d4a574",    // ground color
          dark ? 0.4 : 0.9,                // intensity
        ]}
      />
      <directionalLight
        position={[5, 8, 5]}
        intensity={dark ? 0.6 : 1.2}
        color={dark ? "#8b9dc3" : "#fff8e7"}
        castShadow={false}
      />
      <ambientLight intensity={dark ? 0.15 : 0.5} />
      <pointLight position={[10, 10, 10]} intensity={dark ? 0.8 : 1.5} color={primaryGold} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} color="#e0550b" />
      <pointLight position={[-5, 5, 8]} intensity={dark ? 0.3 : 0.6} color="#fbbf24" />

      {/* Nodes (Molecules) */}
      <instancedMesh ref={nodesRef} args={[undefined, undefined, NODE_COUNT]}>
        <sphereGeometry args={[0.15, 32, 32]} />
        <MeshTransmissionMaterial 
          samples={8} 
          resolution={512}
          thickness={0.5}
          anisotropy={1}
          roughness={0.15}
          clearcoat={1}
          clearcoatRoughness={0.1}
          color={dark ? "#ffffff" : "#f0f0f0"}
          emissive={emissiveGold}
          emissiveIntensity={dark ? 0.8 : 0.3}
          envMapIntensity={2}
          transparent={true}
        />
      </instancedMesh>

      {/* Central Core (Larger Molecule) */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <MeshTransmissionMaterial 
          thickness={1.5}
          roughness={0.05}
          clearcoat={1}
          color="#ffffff"
          emissive="#FFD700"
          emissiveIntensity={1.2}
          envMapIntensity={3}
        />
      </mesh>

      {/* Bonds (Connecting Lines) */}
      <lineSegments ref={bondsRef} geometry={bondGeometry}>
        <lineBasicMaterial 
          color={primaryGold} 
          transparent 
          opacity={dark ? 0.5 : 0.8} 
          linewidth={1}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      {/* Ambient particles (Gold dust) */}
      <Sparkles 
        count={200} 
        size={2} 
        color={emissiveGold} 
        scale={[12, 12, 12]} 
        speed={0.4} 
        opacity={dark ? 0.6 : 0.9} 
      />
    </group>
  );
}
