import { create } from 'zustand'

type Page = 'explore' | 'library' | 'about'

interface UIStore {
  currentPage: Page
  isMenuOpen: boolean
  showOverlay: boolean
  setCurrentPage: (page: Page) => void
  toggleMenu: () => void
  closeMenu: () => void
  toggleOverlay: () => void
  setOverlayVisibility: (visible: boolean) => void
}

export const useUIStore = create<UIStore>((set) => ({
  currentPage: 'explore',
  isMenuOpen: false,
  showOverlay: false,
  setCurrentPage: (page) => set({ currentPage: page }),
  toggleMenu: () => set((state) => ({ isMenuOpen: !state.isMenuOpen })),
  closeMenu: () => set({ isMenuOpen: false }),
  toggleOverlay: () => set((state) => ({ showOverlay: !state.showOverlay })),
  setOverlayVisibility: (visible) => set({ showOverlay: visible }),
}))
