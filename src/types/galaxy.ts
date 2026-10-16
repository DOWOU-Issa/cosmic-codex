import { Language } from './snippet'
import * as THREE from 'three'

export interface PlanetData {
  id: string
  language: Language
  position: THREE.Vector3
  color: string
  size: number
  rotationSpeed: number
  orbitSpeed: number
  orbitRadius: number
  snippets: string[]
}

export interface GalaxyState {
  planets: PlanetData[]
  selectedPlanet: PlanetData | null
  cameraTarget: THREE.Vector3
  isTransitioning: boolean
}

export interface StarData {
  position: THREE.Vector3
  color: string
  size: number
  twinkleSpeed: number
}