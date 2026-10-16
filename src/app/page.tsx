'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSnippets } from '@/hooks/useSnippets'
import { LANGUAGES } from '@/lib/snippets/languages'
import { useUIStore } from '@/store/useUIStore'
import type {
  Language,
  NewSnippetInput,
  Snippet,
  SnippetSort,
  UpdateSnippetInput,
} from '@/types/snippet'

const Scene = dynamic(() => import('@/components/3d/Scene'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-black text-white">
      Chargement de la scène...
    </div>
  ),
})
const Navigation = dynamic(() => import('@/components/ui/Navigation'), { ssr: false })

type Page = 'explore' | 'library' | 'about'
type ViewMode = 'list' | 'grid'
type MotionPreference = 'system' | 'full' | 'reduced'
type ToastKind = 'success' | 'info' | 'error'

type Toast = {
  id: number
  message: string
  kind: ToastKind
}

const ONBOARDING_KEY = 'cosmic-codex-onboarding-complete'
const MOTION_KEY = 'cosmic-codex-motion-preference'

const ONBOARDING_STEPS = [
  {
    title: 'Bienvenue dans Cosmic Codex',
    description:
      'Chaque planète représente un langage. Clique une planète pour ouvrir la bibliothèque de snippets associée.',
  },
  {
    title: 'Bibliothèque intelligente',
    description:
      'Utilise recherche, tri, difficultés, tags et favoris pour trouver rapidement le snippet adapté à ton besoin.',
  },
  {
    title: 'Confort et accessibilité',
    description:
      'La scène adapte ses animations selon les préférences de mouvement et les performances de ton appareil.',
  },
] as const

const SORT_OPTIONS: { value: SnippetSort; label: string }[] = [
  { value: 'relevance', label: 'Pertinence' },
  { value: 'stars', label: 'Popularité' },
  { value: 'updated', label: 'Mise à jour' },
  { value: 'title', label: 'Titre' },
]

const DIFFICULTY_OPTIONS = [
  { value: '', label: 'Toutes difficultés' },
  { value: 'beginner', label: 'Débutant' },
  { value: 'intermediate', label: 'Intermédiaire' },
  { value: 'advanced', label: 'Avancé' },
] as const

function getDefaultSnippetForm(language?: Language): NewSnippetInput {
  return {
    title: '',
    description: '',
    code: '',
    language: language ?? 'typescript',
    tags: [],
    author: '',
    difficulty: 'beginner',
  }
}

function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: Toast[]
  onDismiss: (id: number) => void
}) {
  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[120] flex w-[min(360px,90vw)] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-2xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-md ${
            toast.kind === 'success'
              ? 'border-emerald-300/40 bg-emerald-500/20 text-emerald-50'
              : toast.kind === 'error'
                ? 'border-rose-300/40 bg-rose-500/20 text-rose-50'
                : 'border-cyan-300/40 bg-cyan-500/20 text-cyan-50'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <p>{toast.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="rounded-full border border-white/20 px-2 py-1 text-xs text-white/80 transition hover:bg-white/10"
            >
              Fermer
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function OnboardingOverlay({
  step,
  reducedMotion,
  onNext,
  onPrev,
  onSkip,
}: {
  step: number
  reducedMotion: boolean
  onNext: () => void
  onPrev: () => void
  onSkip: () => void
}) {
  const current = ONBOARDING_STEPS[step]
  const isLast = step === ONBOARDING_STEPS.length - 1

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/90 p-6">
      <div
        className={`max-w-3xl rounded-[32px] border border-white/10 bg-slate-950/85 p-10 shadow-2xl backdrop-blur-xl ${
          reducedMotion ? '' : 'transition-all duration-300'
        }`}
      >
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Onboarding</p>
        <h1 className="mt-4 text-4xl font-bold text-white">{current.title}</h1>
        <p className="mt-6 text-lg leading-8 text-white/80">{current.description}</p>

        <div className="mt-8 flex items-center gap-2" aria-label="Progression onboarding">
          {ONBOARDING_STEPS.map((_, index) => (
            <div
              key={`step-${index}`}
              className={`h-2 rounded-full transition-all ${index === step ? 'w-12 bg-cyan-400' : 'w-6 bg-white/20'}`}
            />
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onSkip}
            className="rounded-3xl border border-white/20 px-5 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/10"
          >
            Passer
          </button>
          <button
            type="button"
            onClick={onPrev}
            disabled={step === 0}
            className="rounded-3xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
          >
            Précédent
          </button>
          <button
            type="button"
            onClick={onNext}
            className="rounded-3xl bg-cyan-500 px-7 py-3 text-sm font-semibold text-black shadow-lg shadow-cyan-500/25 transition hover:bg-cyan-400"
          >
            {isLast ? 'Commencer' : 'Suivant'}
          </button>
        </div>
      </div>
    </div>
  )
}

function MenuPanel({
  currentPage,
  setCurrentPage,
  resetView,
  setOverlayVisibility,
  motionPreference,
  setMotionPreference,
}: {
  currentPage: Page
  setCurrentPage: (page: Page) => void
  resetView: () => void
  setOverlayVisibility: (visible: boolean) => void
  motionPreference: MotionPreference
  setMotionPreference: (mode: MotionPreference) => void
}) {
  const languageEntries = useMemo(
    () => Object.entries(LANGUAGES) as [Language, (typeof LANGUAGES)[Language]][],
    [],
  )

  return (
    <aside className="fixed left-8 top-1/2 z-20 hidden w-72 -translate-y-1/2 border border-white/10 p-6 shadow-2xl glass panel-enter lg:block">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Menu</p>
        <h2 className="text-3xl font-semibold text-white">Cosmic Codex</h2>
      </div>

      <div className="space-y-3" role="tablist" aria-label="Pages">
        {(['explore', 'library', 'about'] as Page[]).map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => {
              setCurrentPage(page)
              setOverlayVisibility(true)
            }}
            aria-current={currentPage === page ? 'page' : undefined}
            className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
              currentPage === page
                ? 'border-cyan-400/30 bg-cyan-500/15 text-white'
                : 'border-transparent bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            {page === 'explore' ? 'Explorer' : page === 'library' ? 'Bibliothèque' : 'À propos'}
          </button>
        ))}
      </div>

      <div className="mt-8 space-y-3 border-t border-white/10 pt-5">
        <button
          type="button"
          onClick={resetView}
          className="w-full rounded-2xl bg-cyan-500/15 px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-cyan-500/25"
        >
          Voir seulement les planètes
        </button>

        <p className="pt-2 text-xs uppercase tracking-[0.35em] text-white/45">Mouvement</p>
        <div className="grid grid-cols-3 gap-2">
          {([
            { value: 'system', label: 'Auto' },
            { value: 'full', label: 'Normal' },
            { value: 'reduced', label: 'Réduit' },
          ] as { value: MotionPreference; label: string }[]).map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setMotionPreference(item.value)}
              aria-pressed={motionPreference === item.value}
              className={`rounded-xl px-2 py-2 text-xs font-semibold transition ${
                motionPreference === item.value
                  ? 'bg-cyan-500 text-black'
                  : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <p className="pt-2 text-xs uppercase tracking-[0.35em] text-white/45">Langages</p>
        <div className="grid grid-cols-2 gap-2">
          {languageEntries.slice(0, 8).map(([language, info]) => (
            <button
              key={language}
              type="button"
              onClick={() => {
                setCurrentPage('library')
                setOverlayVisibility(true)
              }}
              className="rounded-2xl bg-white/5 px-3 py-2 text-left text-xs text-white/85 transition hover:bg-white/10"
            >
              <span className="mr-2 inline-flex rounded bg-white/10 px-1.5 py-0.5 text-[10px]">
                {info.icon}
              </span>
              {info.name}
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}

function ExploreContent({
  onHideOverlay,
  onOpenLibrary,
}: {
  onHideOverlay: () => void
  onOpenLibrary: () => void
}) {
  return (
    <div className="absolute left-6 top-28 z-10 max-w-xl md:left-8 lg:left-[24rem]">
      <div className="border border-white/10 p-6 shadow-2xl glass panel-enter">
        <p className="mb-2 text-xs uppercase tracking-[0.35em] text-cyan-300">Accueil</p>
        <h1 className="text-3xl font-bold leading-tight text-white md:text-4xl">
          Explore les planètes de la programmation
        </h1>
        <p className="mt-4 text-base leading-7 text-white/70">
          Parcours un univers interactif de langages et de snippets. Clique une planète pour ouvrir
          sa bibliothèque.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onHideOverlay}
            className="inline-flex rounded-3xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-black shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400"
          >
            Voir seulement les planètes
          </button>
          <button
            type="button"
            onClick={onOpenLibrary}
            className="inline-flex rounded-3xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Ouvrir la bibliothèque
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-3xl bg-white/5 p-4 text-white/80">
            <p className="text-sm font-semibold text-white">Recherche rapide</p>
            <p className="mt-2 text-sm text-white/70">
              Filtre par texte, langue, difficulté et tags.
            </p>
          </div>
          <div className="rounded-3xl bg-white/5 p-4 text-white/80">
            <p className="text-sm font-semibold text-white">Favoris persistants</p>
            <p className="mt-2 text-sm text-white/70">
              Tes snippets préférés restent disponibles localement.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function SnippetModal({
  snippet,
  isFavorite,
  onToggleFavorite,
  onClose,
  onSaveSnippet,
  onDeleteSnippet,
  onNotify,
}: {
  snippet: Snippet
  isFavorite: boolean
  onToggleFavorite: (id: string) => void
  onClose: () => void
  onSaveSnippet: (id: string, input: UpdateSnippetInput) => Promise<Snippet>
  onDeleteSnippet: (id: string) => Promise<void>
  onNotify: (message: string, kind?: ToastKind) => void
}) {
  const [copyState, setCopyState] = useState<'idle' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [tagsInput, setTagsInput] = useState(snippet.tags.join(', '))
  const [draft, setDraft] = useState<NewSnippetInput>({
    title: snippet.title,
    description: snippet.description,
    code: snippet.code,
    language: snippet.language,
    tags: snippet.tags,
    author: snippet.author,
    difficulty: snippet.difficulty,
  })

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const copySnippet = async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      setCopyState('error')
      return
    }

    try {
      await navigator.clipboard.writeText(snippet.code)
      setCopyState('success')
      onNotify('Code copié dans le presse-papiers.', 'success')
      window.setTimeout(() => setCopyState('idle'), 1600)
    } catch {
      setCopyState('error')
      onNotify('Impossible de copier le code.', 'error')
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setStatusMessage('')
    try {
      const cleanedTags = tagsInput
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag.length > 0)

      const updated = await onSaveSnippet(snippet.id, {
        ...draft,
        tags: cleanedTags,
      })
      setDraft({
        title: updated.title,
        description: updated.description,
        code: updated.code,
        language: updated.language,
        tags: updated.tags,
        author: updated.author,
        difficulty: updated.difficulty,
      })
      setTagsInput(updated.tags.join(', '))
      setIsEditing(false)
      setStatusMessage('Snippet mis à jour.')
      onNotify('Snippet mis à jour.', 'success')
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : 'Échec de mise à jour du snippet.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    const confirmed = window.confirm('Supprimer ce snippet ? Cette action est irréversible.')
    if (!confirmed) return

    setIsDeleting(true)
    try {
      await onDeleteSnippet(snippet.id)
      onNotify('Snippet supprimé.', 'success')
      onClose()
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : 'Échec de suppression du snippet.',
      )
    } finally {
      setIsDeleting(false)
    }
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="snippet-modal-title"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-[1100px] overflow-auto rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl transition-all duration-200"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">
              {LANGUAGES[snippet.language]?.name || snippet.language}
            </p>
            {isEditing ? (
              <input
                id="snippet-modal-title"
                type="text"
                value={draft.title}
                onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-2xl font-bold text-white outline-none focus:border-cyan-400"
              />
            ) : (
              <h2 id="snippet-modal-title" className="mt-2 text-2xl font-bold text-white">
                {snippet.title}
              </h2>
            )}
            {isEditing ? (
              <input
                type="text"
                value={draft.description}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, description: event.target.value }))
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white/85 outline-none focus:border-cyan-400"
              />
            ) : (
              <p className="mt-2 max-w-3xl text-white/75">{snippet.description}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditing((value) => !value)}
              className="rounded-xl border border-white/20 px-3 py-2 text-sm text-white hover:bg-white/10"
            >
              {isEditing ? 'Annuler édition' : 'Éditer'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/20 px-3 py-2 text-sm text-white hover:bg-white/10"
            >
              Fermer
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-white/70">
          <span className="rounded-full bg-white/10 px-3 py-1">
            {isEditing ? draft.difficulty : snippet.difficulty}
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1">{snippet.stars} étoiles</span>
          <span className="rounded-full bg-white/10 px-3 py-1">
            maj {new Date(snippet.updatedAt).toLocaleDateString('fr-FR')}
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1">
            par {isEditing ? draft.author : snippet.author}
          </span>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onToggleFavorite(snippet.id)}
            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
              isFavorite ? 'bg-yellow-300 text-black' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            {isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          </button>
          <button
            type="button"
            onClick={copySnippet}
            className="rounded-2xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-cyan-400"
          >
            Copier le code
          </button>
          {isEditing && (
            <>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-2xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-2xl bg-rose-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-rose-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </>
          )}
          <span className="text-sm text-white/70" aria-live="polite">
            {copyState === 'success'
              ? 'Copie effectuée'
              : copyState === 'error'
                ? 'Copie indisponible'
                : statusMessage || ' '}
          </span>
        </div>

        {isEditing ? (
          <textarea
            value={draft.code}
            onChange={(event) => setDraft((prev) => ({ ...prev, code: event.target.value }))}
            rows={12}
            className="mt-6 w-full rounded-2xl border border-cyan-500/30 bg-black/55 p-4 font-mono text-sm leading-6 text-cyan-100 outline-none focus:border-cyan-400"
          />
        ) : (
          <pre className="mt-6 overflow-x-auto rounded-2xl border border-cyan-500/20 bg-black/50 p-4 text-sm leading-6 text-cyan-100">
            <code>{snippet.code}</code>
          </pre>
        )}

        {isEditing && (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm text-white/85">
              Auteur
              <input
                type="text"
                value={draft.author}
                onChange={(event) => setDraft((prev) => ({ ...prev, author: event.target.value }))}
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-cyan-400"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-white/85">
              Langage
              <select
                value={draft.language}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, language: event.target.value as Language }))
                }
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-cyan-400"
              >
                {Object.entries(LANGUAGES).map(([id, language]) => (
                  <option key={id} value={id}>
                    {language.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm text-white/85">
              Difficulté
              <select
                value={draft.difficulty}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    difficulty: event.target.value as NewSnippetInput['difficulty'],
                  }))
                }
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-cyan-400"
              >
                {DIFFICULTY_OPTIONS.filter((option) => option.value).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {isEditing ? (
            <label className="w-full text-sm text-white/85">
              Tags (separes par virgule)
              <input
                type="text"
                value={tagsInput}
                onChange={(event) => setTagsInput(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-cyan-400"
              />
            </label>
          ) : (
            snippet.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
                #{tag}
              </span>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

function LibraryContent({
  selectedLanguage,
  onLanguageSelect,
}: {
  selectedLanguage?: Language
  onLanguageSelect: (language?: Language) => void
}) {
  const {
    snippets,
    filtered,
    filter,
    sortBy,
    setSortBy,
    updateFilter,
    clearFilters,
    loading,
    favorites,
    toggleFavorite,
    availableTags,
    toggleTag,
    createSnippet,
    refreshSnippets,
    editSnippet,
    removeSnippet,
  } = useSnippets()
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [activeSnippet, setActiveSnippet] = useState<Snippet | null>(null)
  const [showCreatePanel, setShowCreatePanel] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tagsInput, setTagsInput] = useState('')
  const [showTags, setShowTags] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [visibleCount, setVisibleCount] = useState(8)
  const [toasts, setToasts] = useState<Toast[]>([])
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [newSnippet, setNewSnippet] = useState<NewSnippetInput>(
    getDefaultSnippetForm(selectedLanguage),
  )
  const languages = useMemo(
    () => Object.entries(LANGUAGES) as [Language, (typeof LANGUAGES)[Language]][],
    [],
  )

  useEffect(() => {
    updateFilter({ language: selectedLanguage })
  }, [selectedLanguage, updateFilter])

  const activeTags = filter.tags ?? []
  const hasAdvancedFilters =
    Boolean(filter.search?.trim()) ||
    Boolean(filter.difficulty) ||
    Boolean(filter.favoritesOnly) ||
    activeTags.length > 0
  const displayedSnippets = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount],
  )

  const pushToast = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setToasts((prev) => [...prev, { id, message, kind }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 3200)
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const openRandomSnippet = useCallback(() => {
    if (filtered.length === 0) {
      pushToast('Aucun snippet disponible avec les filtres actuels.', 'error')
      return
    }
    const randomIndex = Math.floor(Math.random() * filtered.length)
    setActiveSnippet(filtered[randomIndex])
  }, [filtered, pushToast])

  const exportFavorites = useCallback(() => {
    const favoritesData = snippets.filter((snippet) => favorites.includes(snippet.id))
    if (favoritesData.length === 0) {
      pushToast('Aucun favori à exporter.', 'error')
      return
    }

    const blob = new Blob([JSON.stringify(favoritesData, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `cosmic-codex-favoris-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    pushToast('Favoris exportés en JSON.', 'success')
  }, [favorites, pushToast, snippets])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isTyping =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        target?.isContentEditable
      if (isTyping) return

      if (event.key === '/') {
        event.preventDefault()
        searchInputRef.current?.focus()
      }
      if (event.key.toLowerCase() === 'n') {
        event.preventDefault()
        setShowCreatePanel((value) => !value)
      }
      if (event.key.toLowerCase() === 'r') {
        event.preventDefault()
        openRandomSnippet()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [openRandomSnippet])

  const handleCreateSnippet = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setCreateError(null)
    setIsSubmitting(true)

    try {
      const cleanedTags = tagsInput
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag.length > 0)

      await createSnippet({ ...newSnippet, tags: cleanedTags })
      setNewSnippet(getDefaultSnippetForm(filter.language))
      setTagsInput('')
      setShowCreatePanel(false)
      pushToast('Nouveau snippet ajoute.', 'success')
    } catch (error) {
      setCreateError(
        error instanceof Error ? error.message : 'Impossible de créer le snippet.',
      )
      pushToast(
        error instanceof Error ? error.message : 'Impossible de créer le snippet.',
        'error',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="absolute right-4 top-24 z-10 h-[calc(100vh-7.5rem)] w-[min(980px,calc(100vw-2rem))] md:right-8">
      <div className="flex h-full flex-col border border-white/10 p-6 shadow-2xl glass panel-enter">
        <div className="premium-divider flex flex-col gap-4 pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.35em] text-purple-300">Bibliothèque</p>
            <h1 className="text-3xl font-bold text-white">Snippets rapides</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-pressed={viewMode === 'list'}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                viewMode === 'list'
                  ? 'bg-cyan-500 text-black'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              Liste
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-pressed={viewMode === 'grid'}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                viewMode === 'grid'
                  ? 'bg-cyan-500 text-black'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              Grille
            </button>
            <button
              type="button"
              onClick={() => updateFilter({ favoritesOnly: !filter.favoritesOnly })}
              aria-pressed={Boolean(filter.favoritesOnly)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                filter.favoritesOnly
                  ? 'bg-yellow-300 text-black'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              Favoris
            </button>
            <div className="rounded-3xl bg-white/5 px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">
              {favorites.length} favori{favorites.length > 1 ? 's' : ''} / {snippets.length}
            </div>
            <button
              type="button"
              onClick={() => {
                setShowCreatePanel((value) => !value)
                setNewSnippet((prev) => ({
                  ...prev,
                  language: selectedLanguage ?? filter.language ?? prev.language,
                }))
              }}
              className="rounded-full border border-cyan-300/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
            >
              {showCreatePanel ? 'Fermer ajout' : 'Ajouter snippet'}
            </button>
          </div>
        </div>

        <p className="mt-3 text-base leading-7 text-white/70">
          Recherche instantanée, tri, tags et difficultés pour trouver vite des extraits pertinents.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openRandomSnippet}
            className="rounded-2xl border border-cyan-300/30 bg-cyan-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100 transition hover:bg-cyan-500/20"
          >
            Ouvrir un snippet aléatoire (R)
          </button>
          <button
            type="button"
            onClick={exportFavorites}
            className="rounded-2xl border border-emerald-300/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100 transition hover:bg-emerald-500/20"
          >
            Exporter favoris
          </button>
          <button
            type="button"
            onClick={() => setShowShortcuts((value) => !value)}
            className="rounded-2xl border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/80 transition hover:bg-white/10"
          >
            Raccourcis
          </button>
        </div>

        {showShortcuts && (
          <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-white/75">
            <p className="uppercase tracking-[0.25em] text-cyan-300">Raccourcis clavier</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1">/ : focus recherche</span>
              <span className="rounded-full bg-white/10 px-3 py-1">N : ouvrir ajout snippet</span>
              <span className="rounded-full bg-white/10 px-3 py-1">R : snippet aléatoire</span>
              <span className="rounded-full bg-white/10 px-3 py-1">Esc : fermer modal</span>
            </div>
          </div>
        )}

        {showCreatePanel && (
          <form
            onSubmit={handleCreateSnippet}
            className="mt-4 space-y-3 rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-4"
          >
            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-white/85">
                Titre
                <input
                  type="text"
                  value={newSnippet.title}
                  onChange={(event) =>
                    setNewSnippet((prev) => ({ ...prev, title: event.target.value }))
                  }
                  required
                  className="rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-cyan-400"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-white/85">
                Auteur
                <input
                  type="text"
                  value={newSnippet.author}
                  onChange={(event) =>
                    setNewSnippet((prev) => ({ ...prev, author: event.target.value }))
                  }
                  required
                  className="rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-cyan-400"
                />
              </label>
            </div>

            <label className="flex flex-col gap-2 text-sm text-white/85">
              Description
              <input
                type="text"
                value={newSnippet.description}
                onChange={(event) =>
                  setNewSnippet((prev) => ({ ...prev, description: event.target.value }))
                }
                required
                className="rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-cyan-400"
              />
            </label>

            <div className="grid gap-3 md:grid-cols-3">
              <label className="flex flex-col gap-2 text-sm text-white/85">
                Langage
                <select
                  value={newSnippet.language}
                  onChange={(event) =>
                    setNewSnippet((prev) => ({
                      ...prev,
                      language: event.target.value as Language,
                    }))
                  }
                  className="rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-cyan-400"
                >
                  {languages.map(([id, language]) => (
                    <option key={id} value={id}>
                      {language.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm text-white/85">
                Difficulté
                <select
                  value={newSnippet.difficulty}
                  onChange={(event) =>
                    setNewSnippet((prev) => ({
                      ...prev,
                      difficulty: event.target.value as NewSnippetInput['difficulty'],
                    }))
                  }
                  className="rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-cyan-400"
                >
                  {DIFFICULTY_OPTIONS.filter((option) => option.value).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm text-white/85">
                Tags (separes par virgule)
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(event) => setTagsInput(event.target.value)}
                  placeholder="api, auth, cache"
                  className="rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-cyan-400"
                />
              </label>
            </div>

            <label className="flex flex-col gap-2 text-sm text-white/85">
              Code
              <textarea
                value={newSnippet.code}
                onChange={(event) =>
                  setNewSnippet((prev) => ({ ...prev, code: event.target.value }))
                }
                required
                rows={8}
                className="rounded-2xl border border-white/10 bg-black/30 px-3 py-2 font-mono text-sm text-white outline-none focus:border-cyan-400"
              />
            </label>

            {createError && <p className="text-sm text-rose-300">{createError}</p>}

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-2xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Création...' : 'Créer le snippet'}
              </button>
              <button
                type="button"
                onClick={() => refreshSnippets()}
                className="rounded-2xl border border-white/20 px-4 py-2 text-sm text-white transition hover:bg-white/10"
              >
                Rafraichir
              </button>
            </div>
          </form>
        )}

        <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-2 text-sm text-white/80">
            Recherche
            <input
              ref={searchInputRef}
              type="text"
              value={filter.search || ''}
              onChange={(event) => updateFilter({ search: event.target.value })}
              placeholder="Rechercher un snippet"
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-white/80">
            Langage
            <select
              value={filter.language ?? ''}
              onChange={(event) => {
                const nextLanguage = event.target.value ? (event.target.value as Language) : undefined
                onLanguageSelect(nextLanguage)
                updateFilter({ language: nextLanguage })
                if (nextLanguage) {
                  setNewSnippet((prev) => ({ ...prev, language: nextLanguage }))
                }
              }}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-cyan-400"
            >
              <option value="">Tous les langages</option>
              {languages.map(([id, language]) => (
                <option key={id} value={id}>
                  {language.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm text-white/80">
            Difficulté
            <select
              value={filter.difficulty ?? ''}
              onChange={(event) => {
                const value = event.target.value
                updateFilter({
                  difficulty: value ? (value as NonNullable<typeof filter.difficulty>) : undefined,
                })
              }}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-cyan-400"
            >
              {DIFFICULTY_OPTIONS.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm text-white/80">
            Tri
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SnippetSort)}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-cyan-400"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setShowTags((value) => !value)}
              className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/85 transition hover:bg-white/10"
            >
              {showTags ? 'Masquer tags' : 'Afficher tags'} ({availableTags.length})
            </button>
            {activeTags.length > 0 && (
              <button
                type="button"
                onClick={() => updateFilter({ tags: [] }, { keepLanguage: true })}
                className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
              >
                Retirer tags actifs ({activeTags.length})
              </button>
            )}
          </div>

          {activeTags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {activeTags.map((tag) => (
                <button
                  key={`active-${tag}`}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className="rounded-full bg-cyan-500 px-3 py-1 text-xs font-semibold text-black"
                >
                  #{tag} x
                </button>
              ))}
            </div>
          )}

          {showTags && (
            <div className="snippet-scroll mt-3 max-h-28 overflow-y-auto pr-1">
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => {
                  const active = activeTags.includes(tag)
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      aria-pressed={active}
                      className={`rounded-full px-3 py-1 text-xs transition ${
                        active ? 'bg-cyan-500 text-black' : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      #{tag}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-sm text-white/70">
            {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {hasAdvancedFilters && (
              <button
                type="button"
                onClick={() =>
                  updateFilter(
                    { search: '', difficulty: undefined, favoritesOnly: false, tags: [] },
                    { keepLanguage: true },
                  )
                }
                className="rounded-2xl border border-cyan-300/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100 transition hover:bg-cyan-500/20"
              >
                Nettoyer filtres actifs
              </button>
            )}
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-2xl border border-white/20 px-4 py-2 text-sm text-white transition hover:bg-white/10"
            >
              Réinitialiser les filtres
            </button>
          </div>
        </div>

        <div className="snippet-scroll mt-4 flex-1 overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-3 pr-2">
          <div className={viewMode === 'grid' ? 'grid gap-3 md:grid-cols-2' : 'space-y-3'}>
            {loading ? (
              <div className="text-white/70">Chargement des snippets...</div>
            ) : filtered.length > 0 ? (
              displayedSnippets.map((snippet) => {
                const preview = snippet.code
                  .split('\n')
                  .slice(0, viewMode === 'grid' ? 4 : 6)
                  .join('\n')
                const favorite = favorites.includes(snippet.id)

                return (
                  <article key={snippet.id} className="card-hover border border-white/10 p-4 glass">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">
                        {LANGUAGES[snippet.language]?.name || snippet.language}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleFavorite(snippet.id)}
                          className={`text-sm ${favorite ? 'text-yellow-300' : 'text-white/60 hover:text-white'}`}
                        >
                          {favorite ? 'Favori actif' : 'Ajouter favori'}
                        </button>
                        <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] uppercase text-white/70">
                          {snippet.difficulty}
                        </span>
                      </div>
                    </div>
                    <h2 className="mt-3 text-lg font-semibold text-white">{snippet.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-white/70">{snippet.description}</p>

                    <pre className="mt-3 overflow-x-auto rounded-2xl bg-black/40 p-3 text-xs leading-5 text-cyan-100">
                      <code>{preview}</code>
                    </pre>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {snippet.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveSnippet(snippet)}
                        className="rounded-2xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-cyan-400"
                      >
                        Voir le détail
                      </button>
                      <span className="rounded-2xl bg-white/10 px-3 py-2 text-xs uppercase tracking-[0.2em] text-white/70">
                        {snippet.stars} étoiles
                      </span>
                    </div>
                  </article>
                )
              })
            ) : (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-white/80">
                Aucun snippet ne correspond aux filtres actuels.
                {hasAdvancedFilters ? (
                  <button
                    type="button"
                    onClick={() =>
                      updateFilter(
                        { search: '', difficulty: undefined, favoritesOnly: false, tags: [] },
                        { keepLanguage: true },
                      )
                    }
                    className="mt-3 block rounded-2xl border border-cyan-300/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100 transition hover:bg-cyan-500/20"
                  >
                    Afficher de nouveau les snippets
                  </button>
                ) : null}
              </div>
            )}
          </div>

          {!loading && filtered.length > displayedSnippets.length && (
            <div className="mt-3 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((count) => count + (viewMode === 'grid' ? 6 : 4))}
                className="rounded-2xl border border-cyan-300/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
              >
                Charger plus ({filtered.length - displayedSnippets.length} restants)
              </button>
            </div>
          )}

          {!loading && displayedSnippets.length > 8 && (
            <div className="mt-2 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount(8)}
                className="rounded-2xl border border-white/20 px-3 py-2 text-xs text-white/80 transition hover:bg-white/10"
              >
                Revenir au debut
              </button>
            </div>
          )}
        </div>
      </div>

      {activeSnippet && (
        <SnippetModal
          snippet={activeSnippet}
          isFavorite={favorites.includes(activeSnippet.id)}
          onToggleFavorite={(id) => {
            toggleFavorite(id)
            const isNowFavorite = !favorites.includes(id)
            pushToast(
              isNowFavorite ? 'Snippet ajouté aux favoris.' : 'Snippet retiré des favoris.',
              'info',
            )
          }}
          onSaveSnippet={async (id, input) => {
            const updated = await editSnippet(id, input)
            setActiveSnippet(updated)
            return updated
          }}
          onDeleteSnippet={async (id) => {
            await removeSnippet(id)
          }}
          onNotify={pushToast}
          onClose={() => setActiveSnippet(null)}
        />
      )}

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}

function AboutContent() {
  return (
    <div className="absolute right-6 top-14 z-10 max-w-md">
      <div className="border border-white/10 p-6 shadow-2xl glass panel-enter">
        <p className="mb-2 text-xs uppercase tracking-[0.35em] text-green-300">À propos</p>
        <h1 className="text-3xl font-bold text-white">Cosmic Codex</h1>
        <p className="mt-4 text-base leading-7 text-white/75">
          Une expérience front-end immersive où chaque langage devient une planète. Le projet reste
          100% oriente interface.
        </p>

        <div className="mt-5 space-y-3">
          {[
            {
              title: 'UX moderne',
              description: 'Navigation fluide, overlays animés et bibliothèque filtrable.',
            },
            {
              title: 'Accessibilité',
              description: 'ARIA, contrôles clavier, mouvement réduit et contrastes lisibles.',
            },
            {
              title: 'Scalabilité',
              description: 'Hooks utilitaires pour tri, tags, favoris et persistence locale.',
            },
          ].map((item) => (
            <div key={item.title} className="rounded-3xl bg-white/5 p-4 text-white/80">
              <h2 className="font-semibold text-white">{item.title}</h2>
              <p className="mt-2 text-sm">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function OverlayToggleButton({
  showOverlay,
  toggleOverlay,
}: {
  showOverlay: boolean
  toggleOverlay: () => void
}) {
  return (
    <div className="fixed right-6 top-24 z-30">
      <button
        type="button"
        onClick={toggleOverlay}
        aria-pressed={showOverlay}
        className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
      >
        {showOverlay ? 'Voir seulement les planètes' : 'Réafficher interface'}
      </button>
    </div>
  )
}

export default function Home() {
  const { currentPage, setCurrentPage, showOverlay, toggleOverlay, closeMenu, setOverlayVisibility } =
    useUIStore()

  const [selectedLanguage, setSelectedLanguage] = useState<Language | undefined>()
  const [onboardingStep, setOnboardingStep] = useState<number | null>(0)
  const [motionPreference, setMotionPreference] = useState<MotionPreference>('system')
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [lowPerformance, setLowPerformance] = useState(false)
  const [hasInitializedClientState, setHasInitializedClientState] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const initializeClientState = () => {
      const onboardingHidden = localStorage.getItem(ONBOARDING_KEY)
      setOnboardingStep(onboardingHidden ? null : 0)

      const storedMotion = localStorage.getItem(MOTION_KEY)
      if (storedMotion === 'full' || storedMotion === 'reduced' || storedMotion === 'system') {
        setMotionPreference(storedMotion)
      }

      const media = window.matchMedia('(prefers-reduced-motion: reduce)')
      setPrefersReducedMotion(media.matches)

      const navigatorWithMemory = navigator as Navigator & { deviceMemory?: number }
      const deviceMemory = navigatorWithMemory.deviceMemory
      setLowPerformance(window.innerWidth < 1024 || (typeof deviceMemory === 'number' && deviceMemory <= 4))
      setHasInitializedClientState(true)
    }

    const raf = window.requestAnimationFrame(initializeClientState)
    return () => window.cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!hasInitializedClientState) return
    localStorage.setItem(MOTION_KEY, motionPreference)
  }, [motionPreference, hasInitializedClientState])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const detectPerformance = () => {
      const navigatorWithMemory = navigator as Navigator & { deviceMemory?: number }
      const deviceMemory = navigatorWithMemory.deviceMemory
      setLowPerformance(window.innerWidth < 1024 || (typeof deviceMemory === 'number' && deviceMemory <= 4))
    }

    window.addEventListener('resize', detectPerformance)
    return () => window.removeEventListener('resize', detectPerformance)
  }, [])

  const reducedMotion =
    motionPreference === 'reduced' || (motionPreference === 'system' && prefersReducedMotion)
  const isOnboardingVisible = onboardingStep !== null

  const handlePlanetSelect = (language: Language) => {
    setSelectedLanguage(language)
    setCurrentPage('library')
    setOverlayVisibility(true)
    closeMenu()
  }

  const resetView = () => {
    setSelectedLanguage(undefined)
    setCurrentPage('explore')
    setOverlayVisibility(false)
    closeMenu()
  }

  const finishOnboarding = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ONBOARDING_KEY, 'true')
    }
    setOnboardingStep(null)
    setOverlayVisibility(true)
  }

  const goToNextStep = () => {
    if (onboardingStep === null) return
    if (onboardingStep === ONBOARDING_STEPS.length - 1) {
      finishOnboarding()
      return
    }
    setOnboardingStep(onboardingStep + 1)
  }

  const goToPreviousStep = () => {
    if (onboardingStep === null || onboardingStep === 0) return
    setOnboardingStep(onboardingStep - 1)
  }

  return (
    <main className="relative h-screen w-full overflow-hidden">
      <Scene
        onPlanetSelect={handlePlanetSelect}
        selectedLanguage={selectedLanguage}
        reducedMotion={reducedMotion}
        lowPerformance={lowPerformance}
      />

      {!isOnboardingVisible && <Navigation />}
      {!isOnboardingVisible && (
        <OverlayToggleButton
          showOverlay={showOverlay}
          toggleOverlay={() => {
            toggleOverlay()
            closeMenu()
          }}
        />
      )}

      {!isOnboardingVisible && showOverlay && (
        <MenuPanel
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          resetView={resetView}
          setOverlayVisibility={setOverlayVisibility}
          motionPreference={motionPreference}
          setMotionPreference={setMotionPreference}
        />
      )}

      {!isOnboardingVisible && showOverlay && currentPage === 'explore' && (
        <ExploreContent
          onHideOverlay={() => {
            setOverlayVisibility(false)
            closeMenu()
          }}
          onOpenLibrary={() => {
            setCurrentPage('library')
            setOverlayVisibility(true)
          }}
        />
      )}

      {!isOnboardingVisible && showOverlay && currentPage === 'library' && (
        <LibraryContent selectedLanguage={selectedLanguage} onLanguageSelect={setSelectedLanguage} />
      )}

      {!isOnboardingVisible && showOverlay && currentPage === 'about' && <AboutContent />}

      {isOnboardingVisible && onboardingStep !== null && (
        <OnboardingOverlay
          step={onboardingStep}
          reducedMotion={reducedMotion}
          onNext={goToNextStep}
          onPrev={goToPreviousStep}
          onSkip={finishOnboarding}
        />
      )}
    </main>
  )
}
