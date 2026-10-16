import { create } from 'zustand'
import { PlanetData } from '@/types/galaxy'
import * as THREE from 'three'

interface GalaxyStore {
  planets: PlanetData[]
  selectedPlanet: PlanetData | null
  cameraTarget: THREE.Vector3
  isTransitioning: boolean
  setPlanets: (planets: PlanetData[]) => void
  selectPlanet: (planet: PlanetData | null) => void
  setCameraTarget: (target: THREE.Vector3) => void
  setTransitioning: (isTransitioning: boolean) => void
}

export const useGalaxyStore = create<GalaxyStore>((set) => ({
  planets: [],
  selectedPlanet: null,
  cameraTarget: new THREE.Vector3(0, 0, 0),
  isTransitioning: false,
  setPlanets: (planets) => set({ planets }),
  selectPlanet: (planet) => set({ selectedPlanet: planet }),
  setCameraTarget: (target) => set({ cameraTarget: target }),
  setTransitioning: (isTransitioning) => set({ isTransitioning }),
}))