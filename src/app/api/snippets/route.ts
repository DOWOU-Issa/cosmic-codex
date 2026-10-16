import type { NextRequest } from 'next/server'
import { addSnippet, readSnippets } from '@/lib/snippets/repository'
import type { NewSnippetInput } from '@/types/snippet'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const snippets = await readSnippets()
    return Response.json({ snippets })
  } catch {
    return Response.json(
      { error: 'Impossible de recuperer les snippets.' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as Partial<NewSnippetInput>
    const snippet = await addSnippet({
      title: payload.title ?? '',
      description: payload.description ?? '',
      code: payload.code ?? '',
      language: (payload.language ?? 'typescript') as NewSnippetInput['language'],
      tags: Array.isArray(payload.tags) ? payload.tags : [],
      author: payload.author ?? '',
      difficulty: payload.difficulty ?? 'beginner',
    })

    return Response.json({ snippet }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Requete invalide.'
    return Response.json({ error: message }, { status: 400 })
  }
}
