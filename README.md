# StreamzGPT

A streaming-style movie discovery app with AI-powered suggestions.

**Stack:** Vite · React 19 · TypeScript · Tailwind 4 · React Router · TanStack
Query · (planned) Appwrite + Groq.

## Getting started

```bash
cp .env.example .env.local   # add your TMDB read-access token
npm install
npm run dev
```

Scripts: `dev`, `build`, `preview`, `lint`, `typecheck`, `test`, `format`.

## Structure

```
src/
  components/{layout,movie}   UI building blocks
  pages/                      route components
  services/                   API clients (TMDB)
  lib/                        env, query client, utils
  types/                      shared types
```

## Roadmap

1. Foundation (this PR)
2. Appwrite auth
3. Browse redesign: hero, detail pages, trailers
4. Search and discovery
5. Watchlist / favourites
6. AI suggestions (Groq via Appwrite Function)
7. Tests, a11y, CI/deploy
