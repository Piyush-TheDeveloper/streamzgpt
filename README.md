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

1. Foundation ✅
2. Appwrite auth (email, Google) ✅
3. Browse redesign: hero, detail pages, trailers ✅
4. Search and discovery
5. Watchlist / favourites
6. AI suggestions (Groq via Appwrite Function)
7. Tests, a11y, CI/deploy

## Auth setup (Appwrite)

Set `VITE_APPWRITE_ENDPOINT` and `VITE_APPWRITE_PROJECT_ID` (see
`.env.example`), add your dev/prod hostnames under **Overview → Platforms**, and
enable Email/Password under **Auth → Settings**. Google sign-in is enabled under
**Auth → Settings → Google** with your own OAuth client ID and secret (Google
Cloud Console → APIs & Services → Credentials); use the redirect URI Appwrite
shows for the provider.
