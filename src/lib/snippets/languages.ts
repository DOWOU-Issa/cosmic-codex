import { Language, LanguageInfo } from '@/types/snippet'

export const LANGUAGES: Record<Language, LanguageInfo> = {
  typescript: { name: 'TypeScript', extension: '.ts', color: '#3178C6', icon: 'TS', planetColor: '#3b82f6' },
  javascript: { name: 'JavaScript', extension: '.js', color: '#F7DF1E', icon: 'JS', planetColor: '#eab308' },
  python: { name: 'Python', extension: '.py', color: '#3776AB', icon: 'PY', planetColor: '#06b6d4' },
  rust: { name: 'Rust', extension: '.rs', color: '#DEA584', icon: 'RS', planetColor: '#f97316' },
  go: { name: 'Go', extension: '.go', color: '#00ADD8', icon: 'GO', planetColor: '#14b8a6' },
  java: { name: 'Java', extension: '.java', color: '#007396', icon: 'JV', planetColor: '#ef4444' },
  csharp: { name: 'C#', extension: '.cs', color: '#239120', icon: 'C#', planetColor: '#22c55e' },
  cpp: { name: 'C++', extension: '.cpp', color: '#00599C', icon: 'C++', planetColor: '#a855f7' },
  html: { name: 'HTML', extension: '.html', color: '#E34F26', icon: 'HT', planetColor: '#f97316' },
  css: { name: 'CSS', extension: '.css', color: '#1572B6', icon: 'CS', planetColor: '#ec4899' },
  sql: { name: 'SQL', extension: '.sql', color: '#4479A1', icon: 'SQL', planetColor: '#8b5cf6' },
  bash: { name: 'Bash', extension: '.sh', color: '#4EAA25', icon: 'SH', planetColor: '#10b981' },
}
