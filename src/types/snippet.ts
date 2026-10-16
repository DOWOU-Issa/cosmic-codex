export interface Snippet {
  id: string
  title: string
  description: string
  code: string
  language: Language
  tags: string[]
  createdAt: string
  updatedAt: string
  author: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  stars: number
}

export interface NewSnippetInput {
  title: string
  description: string
  code: string
  language: Language
  tags: string[]
  author: string
  difficulty: Snippet['difficulty']
}

export interface UpdateSnippetInput {
  title?: string
  description?: string
  code?: string
  language?: Language
  tags?: string[]
  author?: string
  difficulty?: Snippet['difficulty']
}

export type Language = 
  | 'typescript'
  | 'javascript'
  | 'python'
  | 'rust'
  | 'go'
  | 'java'
  | 'csharp'
  | 'cpp'
  | 'html'
  | 'css'
  | 'sql'
  | 'bash'

export interface LanguageInfo {
  name: string
  extension: string
  color: string
  icon: string
  planetColor: string
}

export interface SnippetFilter {
  language?: Language
  search?: string
  tags?: string[]
  difficulty?: Snippet['difficulty']
  favoritesOnly?: boolean
}

export type SnippetSort = 'relevance' | 'stars' | 'updated' | 'title'
