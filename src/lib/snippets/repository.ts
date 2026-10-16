import { randomUUID } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { LANGUAGES } from '@/lib/snippets/languages'
import type { NewSnippetInput, Snippet, UpdateSnippetInput } from '@/types/snippet'

const SNIPPETS_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'snippets.json')

function parseJson(content: string): Snippet[] {
  const parsed = JSON.parse(content) as unknown
  if (!Array.isArray(parsed)) return []
  return parsed as Snippet[]
}

function sanitizeTags(tags: string[]): string[] {
  const next = tags
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0)
  return Array.from(new Set(next))
}

function validateInput(input: NewSnippetInput) {
  if (!input.title.trim()) throw new Error('Le titre est obligatoire.')
  if (!input.description.trim()) throw new Error('La description est obligatoire.')
  if (!input.code.trim()) throw new Error('Le code est obligatoire.')
  if (!input.author.trim()) throw new Error('L’auteur est obligatoire.')
  if (!LANGUAGES[input.language]) throw new Error('Langage invalide.')
}

export async function readSnippets(): Promise<Snippet[]> {
  const raw = await fs.readFile(SNIPPETS_FILE_PATH, 'utf8')
  const snippets = parseJson(raw)
  return snippets.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}

async function writeSnippets(snippets: Snippet[]) {
  await fs.writeFile(SNIPPETS_FILE_PATH, JSON.stringify(snippets, null, 2), 'utf8')
}

export async function addSnippet(input: NewSnippetInput): Promise<Snippet> {
  validateInput(input)

  const snippets = await readSnippets()
  const timestamp = new Date().toISOString()

  const snippet: Snippet = {
    id: `${input.language}-${randomUUID().slice(0, 8)}`,
    title: input.title.trim(),
    description: input.description.trim(),
    code: input.code.trim(),
    language: input.language,
    tags: sanitizeTags(input.tags),
    createdAt: timestamp,
    updatedAt: timestamp,
    author: input.author.trim(),
    difficulty: input.difficulty,
    stars: 0,
  }

  const next = [snippet, ...snippets]
  await writeSnippets(next)
  return snippet
}

export async function updateSnippet(id: string, input: UpdateSnippetInput): Promise<Snippet> {
  const snippets = await readSnippets()
  const index = snippets.findIndex((snippet) => snippet.id === id)
  if (index === -1) {
    throw new Error('Snippet introuvable.')
  }

  const current = snippets[index]
  const language = input.language ?? current.language
  if (!LANGUAGES[language]) {
    throw new Error('Langage invalide.')
  }

  const nextSnippet: Snippet = {
    ...current,
    title: input.title?.trim() || current.title,
    description: input.description?.trim() || current.description,
    code: input.code?.trim() || current.code,
    language,
    tags: input.tags ? sanitizeTags(input.tags) : current.tags,
    author: input.author?.trim() || current.author,
    difficulty: input.difficulty ?? current.difficulty,
    updatedAt: new Date().toISOString(),
  }

  if (!nextSnippet.title) throw new Error('Le titre est obligatoire.')
  if (!nextSnippet.description) throw new Error('La description est obligatoire.')
  if (!nextSnippet.code) throw new Error('Le code est obligatoire.')
  if (!nextSnippet.author) throw new Error('L’auteur est obligatoire.')

  snippets[index] = nextSnippet
  await writeSnippets(snippets)
  return nextSnippet
}

export async function deleteSnippet(id: string): Promise<void> {
  const snippets = await readSnippets()
  const next = snippets.filter((snippet) => snippet.id !== id)
  if (next.length === snippets.length) {
    throw new Error('Snippet introuvable.')
  }
  await writeSnippets(next)
}
