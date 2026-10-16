import type { NextRequest } from 'next/server'
import { deleteSnippet, updateSnippet } from '@/lib/snippets/repository'
import type { UpdateSnippetInput } from '@/types/snippet'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const payload = (await request.json()) as UpdateSnippetInput
    const snippet = await updateSnippet(id, payload)
    return Response.json({ snippet })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Requete invalide.'
    const status = message.includes('introuvable') ? 404 : 400
    return Response.json({ error: message }, { status })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    await deleteSnippet(id)
    return Response.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Requete invalide.'
    const status = message.includes('introuvable') ? 404 : 400
    return Response.json({ error: message }, { status })
  }
}
