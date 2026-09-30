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
   3b. "Afterglow" redesign ✅
   3c. Profiles + account menu ✅
4. Search and discovery ✅
5. Watchlist (My List) ✅
6. AI suggestions (Groq via Appwrite Function) ✅
7. Tests, a11y, CI/deploy

## Auth setup (Appwrite)

Set `VITE_APPWRITE_ENDPOINT` and `VITE_APPWRITE_PROJECT_ID` (see
`.env.example`), add your dev/prod hostnames under **Overview → Platforms**, and
enable Email/Password under **Auth → Settings**. Google sign-in is enabled under
**Auth → Settings → Google** with your own OAuth client ID and secret (Google
Cloud Console → APIs & Services → Credentials); use the redirect URI Appwrite
shows for the provider.

## Profiles (Appwrite database)

Profiles live in the `streamzgpt` database, `profiles` table (row security on;
each row is readable/writable only by its owner). Columns: `userId`, `name`,
`avatar`, `kids`, `autoplayTrailers`, `genres[]`. Create access is granted to
signed-in users; per-row permissions are set by the app on create.

Watchlist lives in the `watchlist` table (same owner-only row permissions):
`profileId`, `userId`, `movieId`, `title`, `posterPath`, `releaseDate`,
`voteAverage`. Row id is `{profileId}_{movieId}`, so a film can only be saved once
per profile.

## AI picks (Appwrite Function)

`functions/ai-picks` is an Appwrite Function (Node 22) deployed from this repo
(`main`, root directory `functions/ai-picks`). The browser never sees any AI key:
it calls the function, which asks Groq for suggestions and resolves them against
TMDB. Set these **secret variables** on the function (Console → Functions → AI
Picks → Settings → Variables), then redeploy:

| Variable       | Value                                           |
| -------------- | ----------------------------------------------- |
| `GROQ_API_KEY` | key from https://console.groq.com/keys          |
| `TMDB_TOKEN`   | TMDB "API Read Access Token"                    |
| `GROQ_MODEL`   | optional, defaults to `llama-3.3-70b-versatile` |

Execute permission is limited to signed-in users, and the function has the
`rows.read` scope so it can read the caller's own profile row: the kids
restriction (only titles whose US certification is G/PG, checked per title) is
decided **server-side from that profile**, not from anything the browser sends.
The function timeout is set to 30 s (Groq 15 s + TMDB lookups).

## TMDB proxy (Appwrite Function)

`functions/tmdb` keeps the TMDB token off the client. The app calls the `tmdb`
function with a path such as `/movie/popular?page=1`; the function checks it
against an allow-list of read-only endpoints and parameters, forces
`include_adult=false`, calls TMDB with `TMDB_TOKEN`, and caches successful
responses for 10 minutes. Execute permission is limited to signed-in users.

- **Production:** add a secret variable `TMDB_TOKEN` to the `tmdb` function,
  redeploy it, then delete `VITE_TMDB_TOKEN` from the site and redeploy the site.
- **Local development:** set `VITE_TMDB_TOKEN` in `.env.local` to call TMDB
  directly. It is only honoured by the dev server: production builds ignore it, so
  it can never ship in the bundle or bypass the proxy. If it is unset, requests go
  through the function.
- The proxy limits each account to 120 requests/minute, validates `page` and
  parameter lengths, and de-duplicates concurrent identical requests. It does not
  enforce kids restrictions (TMDB data is public); `ai-picks` does that server-side.
