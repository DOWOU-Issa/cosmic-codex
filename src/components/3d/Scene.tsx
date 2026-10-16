'use client'

import type { Language } from '@/types/snippet'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, OrbitControls, Stars, Text } from '@react-three/drei'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

type SceneProps = {
  onPlanetSelect: (language: Language) => void
  selectedLanguage?: Language
  reducedMotion: boolean
  lowPerformance: boolean
}

type PlanetConfig = {
  position: [number, number, number]
  color: string
  size: number
  name: string
  language: Language
  hasRing?: boolean
  ringColor?: string
}

const PLANETS: PlanetConfig[] = [
  { position: [0, 0, 0], color: '#3178C6', size: 1.9, name: 'TypeScript', language: 'typescript', hasRing: true, ringColor: '#a78bfa' },
  { position: [4.5, 1.2, -2], color: '#F7DF1E', size: 0.95, name: 'JavaScript', language: 'javascript' },
  { position: [-3.8, -0.8, 2.5], color: '#3776AB', size: 1.15, name: 'Python', language: 'python', hasRing: true, ringColor: '#06b6d4' },
  { position: [2.5, -1.5, -4], color: '#DEA584', size: 0.88, name: 'Rust', language: 'rust' },
  { position: [-5.2, 1.4, -2.8], color: '#00ADD8', size: 0.82, name: 'Go', language: 'go' },
  { position: [6.1, -1.1, 1], color: '#007396', size: 1.03, name: 'Java', language: 'java' },
  { position: [1.2, 2.8, -5.8], color: '#239120', size: 0.8, name: 'C#', language: 'csharp' },
  { position: [-1.8, 3.1, 3.8], color: '#00599C', size: 0.9, name: 'C++', language: 'cpp' },
  { position: [7.4, 0.7, -4.5], color: '#E34F26', size: 0.78, name: 'HTML', language: 'html' },
  { position: [-7.1, -0.3, -4.2], color: '#1572B6', size: 0.82, name: 'CSS', language: 'css' },
  { position: [3.1, 3.6, 0.8], color: '#4479A1', size: 0.88, name: 'SQL', language: 'sql' },
  { position: [-3.2, -2.6, -6.1], color: '#4EAA25', size: 0.76, name: 'Bash', language: 'bash' },
]

function createPlanetTexture(color: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 256
  const context = canvas.getContext('2d')

  if (!context) return new THREE.CanvasTexture(canvas)

  const gradient = context.createRadialGradient(256, 128, 0, 256, 128, 256)
  gradient.addColorStop(0, 'rgba(255,255,255,0.45)')
  gradient.addColorStop(0.3, color)
  gradient.addColorStop(1, 'rgba(0,0,0,0.16)')
  context.fillStyle = gradient
  context.fillRect(0, 0, 512, 256)

  for (let i = 0; i < 24; i += 1) {
    context.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'
    context.fillRect(0, i * 10, 512, 4)
  }

  for (let i = 0; i < 120; i += 1) {
    context.fillStyle = `rgba(255,255,255,${Math.random() * 0.18})`
    const x = Math.random() * 512
    const y = Math.random() * 256
    const radius = Math.random() * 10 + 3
    context.beginPath()
    context.arc(x, y, radius, 0, Math.PI * 2)
    context.fill()
  }

  context.globalCompositeOperation = 'soft-light'
  context.fillStyle = 'rgba(255,255,255,0.05)'
  context.fillRect(0, 0, 512, 256)

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(1, 1)
  return texture
}

function OrbitRing({ radius }: { radius: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius - 0.03, radius + 0.03, 128]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.08} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  )
}

function NebulaCloud({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[6.5, 24, 24]} />
      <meshStandardMaterial color={color} transparent opacity={0.08} roughness={1} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  )
}

function Planet({
  position,
  color,
  size,
  name,
  language,
  selected = false,
  hasRing = false,
  ringColor = '#ffffff80',
  onClick,
  reducedMotion,
  lowPerformance,
}: PlanetConfig & {
  selected?: boolean
  onClick?: (language: Language) => void
  reducedMotion: boolean
  lowPerformance: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.PointLight>(null)

  const texture = useMemo(() => createPlanetTexture(color), [color])

  useEffect(() => {
    return () => {
      texture.dispose()
    }
  }, [texture])

  useFrame((state) => {
    if (!meshRef.current) return

    if (!reducedMotion) {
      meshRef.current.rotation.y += 0.0025
      if (ringRef.current) ringRef.current.rotation.z += 0.0012
      if (glowRef.current) {
        glowRef.current.intensity = 0.5 + Math.sin(state.clock.elapsedTime * 1.8) * 0.2
      }
      return
    }

    meshRef.current.rotation.y += 0.0004
    if (ringRef.current) ringRef.current.rotation.z += 0.0002
    if (glowRef.current) glowRef.current.intensity = 0.45
  })

  const segments = lowPerformance ? 32 : 64

  return (
    <Float speed={reducedMotion ? 0 : 2} rotationIntensity={reducedMotion ? 0 : 0.6} floatIntensity={reducedMotion ? 0 : 0.5}>
      <group
        position={position}
        scale={selected ? [1.08, 1.08, 1.08] : [1, 1, 1]}
        onPointerOver={(event) => {
          event.stopPropagation()
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={(event) => {
          event.stopPropagation()
          document.body.style.cursor = 'default'
        }}
        onClick={(event) => {
          event.stopPropagation()
          if (onClick) onClick(language)
        }}
      >
        <pointLight ref={glowRef} color={color} intensity={0.6} distance={6} />

        <mesh ref={meshRef}>
          <sphereGeometry args={[size, segments, segments]} />
          <meshStandardMaterial map={texture} roughness={0.35} metalness={0.12} emissive={color} emissiveIntensity={0.12} />
        </mesh>

        <mesh>
          <sphereGeometry args={[size * 1.11, segments, segments]} />
          <meshStandardMaterial color={color} transparent opacity={0.09} emissive={color} emissiveIntensity={0.25} side={THREE.BackSide} />
        </mesh>

        {hasRing && (
          <mesh ref={ringRef} rotation={[Math.PI / 2.4, 0.3, 0]}>
            <torusGeometry args={[size * 1.8, size * 0.14, lowPerformance ? 12 : 16, lowPerformance ? 80 : 120]} />
            <meshStandardMaterial color={ringColor} transparent opacity={0.45} side={THREE.DoubleSide} emissive={ringColor} emissiveIntensity={0.18} />
          </mesh>
        )}

        {selected && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[size * 1.35, size * 0.06, 16, 120]} />
            <meshBasicMaterial color={color} transparent opacity={0.35} toneMapped={false} />
          </mesh>
        )}

        <Text position={[0, size + 0.9, 0]} fontSize={0.28} color="white" anchorX="center" anchorY="middle" maxWidth={2.5}>
          {name}
        </Text>

        {selected && (
          <group position={[0, size + 1.3, 0]}>
            <Text fontSize={0.15} color="#a5f3fc" anchorX="center" anchorY="middle">
              {language.toUpperCase()}
            </Text>
            <Text position={[0, -0.2, 0]} fontSize={0.11} color="#ffffff" anchorX="center" anchorY="middle" maxWidth={3.2}>
              Cliquez pour ouvrir les snippets
            </Text>
          </group>
        )}
      </group>
    </Float>
  )
}

export default function Scene({ onPlanetSelect, selectedLanguage, reducedMotion, lowPerformance }: SceneProps) {
  const starsCount = lowPerformance ? 4500 : 12000
  const cameraPosition: [number, number, number] = lowPerformance ? [0, 3, 16] : [0, 3, 15]

  return (
    <div className="fixed inset-0">
      <Canvas
        camera={{ position: cameraPosition, fov: 50 }}
        dpr={lowPerformance ? [1, 1.3] : [1, 2]}
        style={{ background: 'radial-gradient(circle at center, #0b122f 0%, #020108 100%)' }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.18} />
          <pointLight position={[10, 10, 10]} intensity={1.5} color="#a78bfa" />
          <pointLight position={[-10, -5, -10]} intensity={0.8} color="#06b6d4" />
          <directionalLight position={[5, 10, 5]} intensity={0.5} color="#ffffff" />

          <Stars radius={160} depth={80} count={starsCount} factor={5} saturation={0.25} fade speed={reducedMotion ? 0 : 0.7} />
          <NebulaCloud position={[-8, 2, -15]} color="#5b21b6" />
          <NebulaCloud position={[10, -2, -18]} color="#0ea5e9" />
          <NebulaCloud position={[2, 6, -12]} color="#ec4899" />

          <OrbitRing radius={4.8} />
          <OrbitRing radius={6.8} />
          <OrbitRing radius={8.4} />

          {PLANETS.map((planet) => (
            <Planet
              key={planet.language}
              {...planet}
              selected={selectedLanguage === planet.language}
              onClick={onPlanetSelect}
              reducedMotion={reducedMotion}
              lowPerformance={lowPerformance}
            />
          ))}

          <OrbitControls
            enableZoom
            enablePan
            autoRotate={!reducedMotion}
            autoRotateSpeed={0.28}
            maxPolarAngle={Math.PI / 2.2}
            minDistance={8}
            maxDistance={25}
            enableDamping
            dampingFactor={0.05}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
