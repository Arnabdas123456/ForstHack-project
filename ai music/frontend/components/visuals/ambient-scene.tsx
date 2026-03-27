"use client"

import { useMemo, useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import * as THREE from "three"

function FloatingCluster({ color, position, scale = 1 }: { color: string; position: [number, number, number]; scale?: number }) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.getElapsedTime()
    groupRef.current.rotation.x = Math.sin(t * 0.2) * 0.12
    groupRef.current.rotation.y += 0.0015
    groupRef.current.position.y = position[1] + Math.sin(t * 0.5 + position[0]) * 0.18
  })

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <mesh>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial
          color={color}
          roughness={0.18}
          metalness={0.58}
          transparent
          opacity={0.23}
          emissive={new THREE.Color(color)}
          emissiveIntensity={0.35}
        />
      </mesh>
    </group>
  )
}

function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null)

  const particles = useMemo(() => {
    const count = 1600
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 14
      positions[i * 3 + 1] = (Math.random() - 0.5) * 9
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10
    }
    return positions
  }, [])

  useFrame(({ clock }) => {
    if (!pointsRef.current) return
    pointsRef.current.rotation.y = clock.getElapsedTime() * 0.01
    pointsRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.13) * 0.03
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[particles, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#93c5fd" size={0.017} transparent opacity={0.42} depthWrite={false} />
    </points>
  )
}

export function AmbientScene() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <Canvas dpr={[1, 1.35]} camera={{ position: [0, 0, 6], fov: 50 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.75} />
        <directionalLight position={[5, 6, 4]} intensity={1.2} color="#67e8f9" />
        <pointLight position={[-4, -2, 1]} intensity={2.2} color="#38bdf8" />
        <pointLight position={[4, 2, 2]} intensity={1.5} color="#f59e0b" />

        <FloatingCluster color="#22d3ee" position={[-2.6, 1.2, -2.2]} scale={1.1} />
        <FloatingCluster color="#60a5fa" position={[2.5, -0.8, -1.4]} scale={0.82} />
        <FloatingCluster color="#fb923c" position={[0.3, 2.4, -3.1]} scale={0.62} />
        <ParticleField />
      </Canvas>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(56,189,248,0.16),transparent_34%),radial-gradient(circle_at_80%_8%,rgba(14,165,233,0.15),transparent_32%),radial-gradient(circle_at_65%_75%,rgba(249,115,22,0.08),transparent_28%)]" />
    </div>
  )
}
