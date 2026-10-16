import { useEffect } from 'react'
import { useGalaxyStore } from '@/store/useGalaxyStore'
import { PlanetData } from '@/types/galaxy'
import { Language } from '@/types/snippet'
import { LANGUAGES } from '@/lib/snippets/languages'
import * as THREE from 'three'

function generatePositions(count: number): THREE.Vector3[] {
  const positions: THREE.Vector3[] = []
  const goldenRatio = (1 + Math.sqrt(5)) / 2
  for (let i = 0; i < count; i++) {
    const theta = 2 * Math.PI * i / goldenRatio
    const phi = Math.acos(1 - 2 * (i + 0.5) / count)
    const radius = 5 + Math.random() * 3
    const x = radius * Math.sin(phi) * Math.cos(theta)
    const y = radius * Math.sin(phi) * Math.sin(theta) * 0.5
    const z = radius * Math.cos(phi)
    positions.push(new THREE.Vector3(x, y, z))
  }
  return positions
}

export function useGalaxy() {
  const { setPlanets } = useGalaxyStore()

  useEffect(() => {
    const languages = Object.keys(LANGUAGES) as Language[]
    const positions = generatePositions(languages.length)
    const planets: PlanetData[] = languages.map((lang, i) => ({
      id: `planet-${lang}`,
      language: lang,
      position: positions[i],
      color: LANGUAGES[lang].planetColor,
      size: 0.8 + Math.random() * 0.7,
      rotationSpeed: 0.5 + Math.random(),
      orbitSpeed: 0.2 + Math.random() * 0.5,
      orbitRadius: positions[i].length(),
      snippets: [],
    }))
    setPlanets(planets)
  }, [setPlanets])
}