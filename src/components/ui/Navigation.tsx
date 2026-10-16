'use client'

import { useUIStore } from '@/store/useUIStore'

type Page = 'explore' | 'library' | 'about'

const links: { page: Page; label: string }[] = [
  { page: 'explore', label: 'Explorer' },
  { page: 'library', label: 'Bibliotheque' },
  { page: 'about', label: 'A propos' },
]

export default function Navigation() {
  const { currentPage, setCurrentPage, isMenuOpen, toggleMenu, closeMenu, setOverlayVisibility } = useUIStore()

  const handleNavClick = (page: Page) => {
    setCurrentPage(page)
    setOverlayVisibility(true)
    closeMenu()
  }

  return (
    <nav className="absolute inset-x-0 top-0 z-20 p-6" aria-label="Navigation principale">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="text-2xl font-bold text-white">
          <span className="text-cyan-400">*</span> Cosmic Codex
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <div className="hidden gap-8 lg:flex" role="tablist" aria-label="Sections">
            {links.map((link) => (
              <button
                key={link.page}
                type="button"
                onClick={() => handleNavClick(link.page)}
                aria-current={currentPage === link.page ? 'page' : undefined}
                className={`transition-colors ${
                  currentPage === link.page
                    ? 'border-b-2 border-cyan-400 text-white'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setOverlayVisibility(true)
              closeMenu()
            }}
            className="glass px-4 py-2 text-sm text-white"
            aria-label="Afficher le panneau principal"
          >
            Menu
          </button>
        </div>

        <button
          type="button"
          onClick={toggleMenu}
          className="glass px-4 py-2 text-sm text-white md:hidden"
          aria-expanded={isMenuOpen}
          aria-controls="mobile-nav-panel"
        >
          Menu
        </button>
      </div>

      {isMenuOpen && (
        <div
          id="mobile-nav-panel"
          className="absolute inset-x-6 top-20 z-30 glass p-5 shadow-2xl md:hidden"
          role="dialog"
          aria-label="Navigation mobile"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Menu rapide</p>
              <h2 className="text-xl font-semibold text-white">Cosmic Codex</h2>
            </div>
            <button type="button" onClick={closeMenu} className="text-white/70 hover:text-white">
              Fermer
            </button>
          </div>

          <div className="space-y-3">
            {links.map((link) => (
              <button
                key={link.page}
                type="button"
                onClick={() => handleNavClick(link.page)}
                className="block w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="mt-6 border-t border-white/10 pt-4">
            <p className="mb-3 text-xs uppercase tracking-[0.35em] text-white/40">Apercu</p>
            <div className="grid gap-3">
              <div className="rounded-2xl bg-white/5 p-3 text-sm text-white/80">Planetes interactives</div>
              <div className="rounded-2xl bg-white/5 p-3 text-sm text-white/80">Snippets enrichis</div>
              <div className="rounded-2xl bg-white/5 p-3 text-sm text-white/80">Filtres avances</div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
