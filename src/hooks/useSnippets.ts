import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  NewSnippetInput,
  Snippet,
  SnippetFilter,
  SnippetSort,
  UpdateSnippetInput,
} from '@/types/snippet'
import { filterSnippets, getAllSnippets, sortSnippets } from '@/lib/snippets'

const FAVORITES_STORAGE_KEY = 'cosmic-codex-favorites'

type UpdateOptions = {
  keepLanguage?: boolean
}

function readFavoritesFromStorage(): string[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is string => typeof item === 'string')
  } catch {
    return []
  }
}

async function readSnippetsFromApi(): Promise<Snippet[]> {
  const response = await fetch('/api/snippets', { cache: 'no-store' })
  if (!response.ok) {
    throw new Error('Impossible de charger les snippets.')
  }
  const payload = (await response.json()) as { snippets?: Snippet[] }
  return payload.snippets ?? []
}

export function useSnippets(initialFilter?: SnippetFilter) {
  const [snippets, setSnippets] = useState<Snippet[]>(() => getAllSnippets())
  const [filter, setFilter] = useState<SnippetFilter>(initialFilter || {})
  const [sortBy, setSortBy] = useState<SnippetSort>('relevance')
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<string[]>(readFavoritesFromStorage)

  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites))
  }, [favorites])

  useEffect(() => {
    let isMounted = true

    readSnippetsFromApi()
      .then((remoteSnippets) => {
        if (!isMounted) return
        setSnippets(remoteSnippets)
      })
      .catch(() => {
        if (!isMounted) return
        setSnippets(getAllSnippets())
      })
      .finally(() => {
        if (!isMounted) return
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const refreshSnippets = useCallback(async () => {
    setLoading(true)
    try {
      const remoteSnippets = await readSnippetsFromApi()
      setSnippets(remoteSnippets)
    } finally {
      setLoading(false)
    }
  }, [])

  const availableTags = useMemo(
    () =>
      Array.from(
        new Set(
          snippets
            .flatMap((snippet) => snippet.tags)
            .map((tag) => tag.toLowerCase()),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [snippets],
  )

  const filtered = useMemo(() => {
    let next = filterSnippets({ ...filter }, snippets)

    if (filter.favoritesOnly) {
      next = next.filter((snippet) => favorites.includes(snippet.id))
    }

    return sortSnippets(next, sortBy)
  }, [favorites, filter, snippets, sortBy])

  const updateFilter = useCallback((newFilter: Partial<SnippetFilter>, options?: UpdateOptions) => {
    setFilter((prev) => {
      const next = { ...prev, ...newFilter }
      if (options?.keepLanguage) {
        next.language = prev.language
      } else if (Object.prototype.hasOwnProperty.call(newFilter, 'language')) {
        next.language = newFilter.language
      }
      return next
    })
  }, [])

  const clearFilters = useCallback(() => {
    setFilter((prev) => ({
      language: prev.language,
      search: '',
      tags: [],
      difficulty: undefined,
      favoritesOnly: false,
    }))
    setSortBy('relevance')
  }, [])

  const toggleTag = useCallback((tag: string) => {
    setFilter((prev) => {
      const current = prev.tags ?? []
      const alreadySelected = current.includes(tag)
      const nextTags = alreadySelected ? current.filter((item) => item !== tag) : [...current, tag]
      return { ...prev, tags: nextTags }
    })
  }, [])

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((favorite) => favorite !== id) : [...prev, id],
    )
  }, [])

  const createSnippet = useCallback(async (input: NewSnippetInput) => {
    const response = await fetch('/api/snippets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string }
      throw new Error(payload.error ?? 'Échec de création du snippet.')
    }

    const payload = (await response.json()) as { snippet: Snippet }
    setSnippets((prev) => [payload.snippet, ...prev])
    return payload.snippet
  }, [])

  const editSnippet = useCallback(async (id: string, input: UpdateSnippetInput) => {
    const response = await fetch(`/api/snippets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string }
      throw new Error(payload.error ?? 'Échec de mise à jour du snippet.')
    }

    const payload = (await response.json()) as { snippet: Snippet }
    setSnippets((prev) =>
      prev.map((snippet) => (snippet.id === id ? payload.snippet : snippet)),
    )
    return payload.snippet
  }, [])

  const removeSnippet = useCallback(async (id: string) => {
    const response = await fetch(`/api/snippets/${id}`, { method: 'DELETE' })
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string }
      throw new Error(payload.error ?? 'Échec de suppression du snippet.')
    }
    setSnippets((prev) => prev.filter((snippet) => snippet.id !== id))
  }, [])

  return {
    snippets,
    filtered,
    filter,
    sortBy,
    setSortBy,
    updateFilter,
    clearFilters,
    availableTags,
    loading,
    favorites,
    toggleFavorite,
    toggleTag,
    refreshSnippets,
    createSnippet,
    editSnippet,
    removeSnippet,
  }
}
