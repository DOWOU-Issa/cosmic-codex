# Cosmic Codex

Cosmic Codex est une bibliothèque de code immersive en 3D. L'application affiche un univers de planètes représentant des langages et permet de naviguer entre une galaxie de snippets, une bibliothèque dynamique et une section à propos.

## Fonctionnalités principales

- Exploration 3D en temps réel avec `react-three-fiber` et `drei`
- Overlay interactif pour afficher les sections `Explorer`, `Bibliothèque` et `À propos`
- Bouton « Voir seulement les planètes » pour masquer l'interface et retrouver la vue complète de la galaxie
- Recherche et filtre multi-langages de snippets
- Gestion locale des favoris pour marquer les meilleurs extraits
- Navigation responsive avec menu mobile

## Architecture

- `src/app/page.tsx` — point d'entrée, affichage principal et gestion globale de l'interface
- `src/components/3d/Scene.tsx` — rendu de la scène 3D, planètes, étoiles et contrôles de caméra
- `src/components/ui/Navigation.tsx` — barre de navigation et menu mobile
- `src/hooks/useSnippets.ts` — hook de filtrage des snippets et gestion des favoris
- `src/store/useUIStore.ts` — store Zustand pour gérer l'état de l'interface, la page active et l'affichage des overlays
- `src/lib/snippets/` — données et utilitaires pour les snippets et les langages
- `src/types/` — types TypeScript pour les snippets et la galaxie

## Installation et Lancement

Pour installer et lancer le projet localement, suivez les étapes ci-dessous :

1.  **Cloner le dépôt :**
    ```bash
    git clone https://github.com/DOWOU-Issa/cosmic-codex.git
    cd cosmic-codex
    ```

2.  **Installer les dépendances :**
    ```bash
    npm install
    # ou yarn install
    # ou pnpm install
    ```

3.  **Lancer le serveur de développement :**
    ```bash
    npm run dev
    # ou yarn dev
    # ou pnpm dev
    ```

    L'application sera accessible à l'adresse `http://localhost:3000`.

## Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.
