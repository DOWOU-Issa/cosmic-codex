import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Cosmic Codex',
    template: '%s | Cosmic Codex',
  },
  description:
    'Bibliotheque de snippets frontend avec scene 3D interactive, filtres avances, favoris persistants et onboarding immersif.',
  openGraph: {
    title: 'Cosmic Codex',
    description:
      'Explore des planetes de langages et ouvre une bibliotheque de snippets avec recherche, tri et favoris.',
    type: 'website',
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cosmic Codex',
    description:
      'Projet frontend immersif: scene 3D, snippets filtres, favoris persistants et confort d utilisation.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
