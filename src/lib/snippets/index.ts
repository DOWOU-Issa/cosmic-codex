import { Snippet, Language, SnippetFilter, SnippetSort } from '@/types/snippet'
import snippetsData from '@/data/snippets.json'

function getSource(source?: Snippet[]): Snippet[] {
  return source ?? (snippetsData as Snippet[])
}

export function getAllSnippets(): Snippet[] {
  return getSource()
}

export function getSnippetById(id: string): Snippet | undefined {
  return getSource().find((snippet) => snippet.id === id)
}

export function getSnippetsByLanguage(language: Language): Snippet[] {
  return getSource().filter((snippet) => snippet.language === language)
}

export function searchSnippets(query: string, source?: Snippet[]): Snippet[] {
  const lowercaseQuery = query.trim().toLowerCase()
  return getSource(source).filter((snippet) =>
    snippet.code.toLowerCase().includes(lowercaseQuery) ||
    snippet.title.toLowerCase().includes(lowercaseQuery) ||
    snippet.description.toLowerCase().includes(lowercaseQuery) ||
    snippet.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery)) ||
    snippet.author.toLowerCase().includes(lowercaseQuery)
  )
}

export function filterSnippets(filter: SnippetFilter, source?: Snippet[]): Snippet[] {
  let filtered = getSource(source)

  if (filter.language) {
    filtered = filtered.filter((snippet) => snippet.language === filter.language)
  }

  if (filter.search?.trim()) {
    const lowercaseQuery = filter.search.trim().toLowerCase()
    filtered = filtered.filter((snippet) =>
      snippet.code.toLowerCase().includes(lowercaseQuery) ||
      snippet.title.toLowerCase().includes(lowercaseQuery) ||
      snippet.description.toLowerCase().includes(lowercaseQuery) ||
      snippet.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery)) ||
      snippet.author.toLowerCase().includes(lowercaseQuery),
    )
  }

  if (filter.tags?.length) {
    filtered = filtered.filter((snippet) =>
      filter.tags!.some((tag) => snippet.tags.includes(tag)),
    )
  }

  if (filter.difficulty) {
    filtered = filtered.filter((snippet) => snippet.difficulty === filter.difficulty)
  }

  return filtered
}

export function sortSnippets(snippets: Snippet[], sortBy: SnippetSort): Snippet[] {
  const sorted = [...snippets]

  if (sortBy === 'stars') {
    sorted.sort((a, b) => b.stars - a.stars)
    return sorted
  }

  if (sortBy === 'updated') {
    sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    return sorted
  }

  if (sortBy === 'title') {
    sorted.sort((a, b) => a.title.localeCompare(b.title))
    return sorted
  }

  return sorted
}
