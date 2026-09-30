// Pure helpers for the ai-picks function. `fetch` is injected so they're testable.

export const MAX_PICKS = 10
const KID_SAFE = new Set(['G', 'PG', 'TV-Y', 'TV-Y7', 'TV-G'])
const TMDB = 'https://api.themoviedb.org/3'

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const list = (v, maxItems, maxLen) =>
  Array.isArray(v)
    ? v
        .map(x => str(x, maxLen))
        .filter(Boolean)
        .slice(0, maxItems)
    : []

/** Validates and clamps client input. Throws Error on unusable input. */
export function validateInput(raw) {
  if (!raw || typeof raw !== 'object')
    throw new Error('Expected a JSON object.')
  const input = {
    prompt: str(raw.prompt, 300),
    mood: str(raw.mood, 60),
    genres: list(raw.genres, 8, 30),
    saved: list(raw.saved, 10, 100),
    kids: raw.kids === true,
  }
  return input
}

export function buildMessages(input) {
  const system = [
    'You are StreamzGPT, a film recommendation engine.',
    `Recommend up to ${MAX_PICKS} REAL feature films that exist. Never invent titles.`,
    'Reply with ONLY a JSON object: {"picks":[{"title":string,"year":number,"reason":string}]}.',
    'Each reason is one short sentence (under 25 words) saying why it fits the request.',
    'Do not recommend films listed under "already saved".',
    input.kids
      ? 'The viewer is a child: recommend only family-friendly films rated G or PG.'
      : 'Prefer well-regarded films; mix well-known and lesser-known picks.',
  ].join('\n')

  const lines = []
  if (input.prompt) lines.push(`Request: ${input.prompt}`)
  if (input.mood) lines.push(`Mood: ${input.mood}`)
  if (input.genres.length)
    lines.push(`Favourite genres: ${input.genres.join(', ')}`)
  if (input.saved.length) lines.push(`Already saved: ${input.saved.join('; ')}`)
  if (!lines.length) lines.push('Request: surprise me with something great.')
  return [
    { role: 'system', content: system },
    { role: 'user', content: lines.join('\n') },
  ]
}

/** Parses the model output defensively into [{title, year, reason}]. */
export function parsePicks(text) {
  let data
  try {
    data = JSON.parse(text)
  } catch {
    const match = /\{[\s\S]*\}/.exec(text ?? '')
    if (!match) return []
    try {
      data = JSON.parse(match[0])
    } catch {
      return []
    }
  }
  const picks = Array.isArray(data?.picks) ? data.picks : []
  const seen = new Set()
  const out = []
  for (const p of picks) {
    const title = str(p?.title, 120)
    if (!title || seen.has(title.toLowerCase())) continue
    seen.add(title.toLowerCase())
    const year =
      Number.isInteger(p?.year) && p.year > 1880 && p.year < 2100
        ? p.year
        : null
    out.push({ title, year, reason: str(p?.reason, 240) })
    if (out.length === MAX_PICKS) break
  }
  return out
}

const pickFields = m => ({
  id: m.id,
  title: m.title,
  overview: m.overview ?? '',
  poster_path: m.poster_path ?? null,
  backdrop_path: m.backdrop_path ?? null,
  release_date: m.release_date ?? '',
  vote_average: m.vote_average ?? 0,
  genre_ids: m.genre_ids ?? [],
})

async function tmdb(path, token, fetchImpl) {
  const res = await fetchImpl(`${TMDB}${path}`, {
    headers: { accept: 'application/json', Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`TMDB ${res.status}`)
  return res.json()
}

/** Finds the film a pick refers to, preferring an exact title (+ year) match. */
export async function resolvePick(pick, token, fetchImpl = fetch) {
  const params = new URLSearchParams({
    query: pick.title,
    include_adult: 'false',
  })
  if (pick.year) params.set('primary_release_year', String(pick.year))
  const { results = [] } = await tmdb(
    `/search/movie?${params}`,
    token,
    fetchImpl,
  )
  const exact = results.find(
    r => r.title?.toLowerCase() === pick.title.toLowerCase() && r.poster_path,
  )
  const best = exact ?? results.find(r => r.poster_path)
  return best ? pickFields(best) : null
}

async function isKidSafe(movieId, token, fetchImpl) {
  const { results = [] } = await tmdb(
    `/movie/${movieId}/release_dates`,
    token,
    fetchImpl,
  )
  const us = results.find(r => r.iso_3166_1 === 'US')
  const cert =
    us?.release_dates?.find(d => d.certification)?.certification ?? ''
  return KID_SAFE.has(cert)
}

/** Resolves picks against TMDB, dropping unknown, saved and (for kids) unsafe titles. */
export async function enrichPicks({
  picks,
  token,
  kids,
  savedTitles = [],
  fetchImpl = fetch,
}) {
  const saved = new Set(savedTitles.map(t => t.toLowerCase()))
  const resolved = await Promise.all(
    picks.map(async pick => {
      try {
        const movie = await resolvePick(pick, token, fetchImpl)
        if (!movie || saved.has(movie.title.toLowerCase())) return null
        if (kids && !(await isKidSafe(movie.id, token, fetchImpl))) return null
        return { movie, reason: pick.reason }
      } catch {
        return null
      }
    }),
  )
  const seen = new Set()
  return resolved.filter(
    r => r && !seen.has(r.movie.id) && seen.add(r.movie.id),
  )
}
