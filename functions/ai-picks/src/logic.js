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
  const profileId = str(raw.profileId, 36)
  if (!profileId) throw new Error('profileId is required.')
  const input = {
    profileId,
    prompt: str(raw.prompt, 300),
    mood: str(raw.mood, 60),
    genres: list(raw.genres, 8, 30),
    saved: list(raw.saved, 10, 100),
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
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) throw new Error(`TMDB ${res.status}`)
  return res.json()
}

const normalize = t =>
  (t ?? '')
    .toLowerCase()
    .replace(/\(\d{4}\)\s*$/, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()

const yearOf = date => Number.parseInt((date ?? '').slice(0, 4), 10) || null

async function searchFilms(title, year, token, fetchImpl) {
  const params = new URLSearchParams({ query: title, include_adult: 'false' })
  if (year) params.set('primary_release_year', String(year))
  const { results = [] } = await tmdb(
    `/search/movie?${params}`,
    token,
    fetchImpl,
  )
  return results.filter(r => r.poster_path)
}

/**
 * Finds the film a pick refers to. The model's year is only a hint (models are
 * often off by one), so we retry without it, but a result must still match the
 * title: a hallucinated title must not resolve to an unrelated film.
 */
export async function resolvePick(pick, token, fetchImpl = fetch) {
  const want = normalize(pick.title)
  const matches = (r, allowLoose) => {
    const got = normalize(r.title)
    if (got === want) return true
    if (!allowLoose) return false
    const related = got.includes(want) || want.includes(got)
    const y = yearOf(r.release_date)
    return related && (!pick.year || !y || Math.abs(y - pick.year) <= 1)
  }
  const attempts = pick.year ? [pick.year, null] : [null]
  for (const year of attempts) {
    const results = await searchFilms(pick.title, year, token, fetchImpl)
    const hit =
      results.find(r => matches(r, false)) ??
      results.find(r => matches(r, true))
    if (hit) return pickFields(hit)
  }
  return null
}

async function isKidSafe(movieId, token, fetchImpl) {
  const { results = [] } = await tmdb(
    `/movie/${movieId}/release_dates`,
    token,
    fetchImpl,
  )
  const certOf = country => {
    const dates =
      results.find(r => r.iso_3166_1 === country)?.release_dates ?? []
    // Type 3 = theatrical; prefer it so a premiere/digital entry can't mask the rating.
    return (
      dates.find(d => d.type === 3 && d.certification)?.certification ??
      dates.find(d => d.certification)?.certification ??
      ''
    )
  }
  // US G/PG family ratings, or India's all-ages "U".
  return KID_SAFE.has(certOf('US')) || certOf('IN') === 'U'
}

/**
 * Resolves picks against TMDB, dropping unknown, saved and (for kids) unsafe
 * titles. Also reports how many lookups *errored* (vs. simply not matching) so
 * an outage isn't mistaken for "no results".
 */
export async function enrichPicks({
  picks,
  token,
  kids,
  savedTitles = [],
  fetchImpl = fetch,
}) {
  const saved = new Set(savedTitles.map(t => t.toLowerCase()))
  let errors = 0
  let lastError = null
  const resolved = await Promise.all(
    picks.map(async pick => {
      try {
        const movie = await resolvePick(pick, token, fetchImpl)
        if (!movie || saved.has(movie.title.toLowerCase())) return null
        if (kids && !(await isKidSafe(movie.id, token, fetchImpl))) return null
        return { movie, reason: pick.reason }
      } catch (e) {
        errors += 1
        lastError = e
        return null
      }
    }),
  )
  const seen = new Set()
  const items = resolved.filter(
    r => r && !seen.has(r.movie.id) && seen.add(r.movie.id),
  )
  return { items, errors, lastError }
}

/**
 * Reads the caller's profile with the function's scoped API key and returns
 * whether it is a kids profile. Returns null if it doesn't exist or isn't theirs.
 */
export async function fetchProfileKids({
  endpoint,
  project,
  key,
  profileId,
  userId,
  fetchImpl = fetch,
}) {
  const res = await fetchImpl(
    `${endpoint}/tablesdb/streamzgpt/tables/profiles/rows/${encodeURIComponent(profileId)}`,
    {
      headers: { 'x-appwrite-project': project, 'x-appwrite-key': key },
      signal: AbortSignal.timeout(5000),
    },
  )
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Appwrite ${res.status}`)
  const row = await res.json()
  return row.userId === userId ? { kids: row.kids === true } : null
}

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

/**
 * Models to try, in order. Groq retires models over time (llama-3.3-70b-versatile
 * is gone), so an unknown/retired model (404) falls through to the next one
 * instead of breaking the feature. GROQ_MODEL, when set, is tried first.
 */
export const groqModels = override =>
  [
    ...new Set([
      override,
      'openai/gpt-oss-120b',
      'qwen/qwen3.6-27b',
      'openai/gpt-oss-20b',
    ]),
  ].filter(Boolean)

export class GroqError extends Error {
  constructor(code, message) {
    super(message ?? code)
    this.code = code // 'rate_limited' | 'auth' | 'upstream'
  }
}

/**
 * Asks Groq for a completion, walking the model list. Returns { content, model }.
 * Throws GroqError. `log` receives non-secret diagnostics (status + short body).
 */
export async function askGroq({
  apiKey,
  messages,
  models,
  fetchImpl = fetch,
  log = () => {},
  budgetMs = 22000,
  now = Date.now,
}) {
  const deadline = now() + budgetMs
  const call = async (model, jsonMode) => {
    const timeout = Math.min(12000, deadline - now())
    if (timeout < 1500) throw new GroqError('upstream', 'out of time')
    const body = {
      model,
      messages,
      temperature: 0.8,
      // gpt-oss "thinks" first and those tokens count against the limit.
      max_tokens: 2500,
      ...(model.startsWith('openai/gpt-oss')
        ? { reasoning_effort: 'low' }
        : {}),
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }
    const res = await fetchImpl(GROQ_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeout),
    })
    if (res.ok) return { ok: true, res }
    const text = await res.text?.().catch(() => '')
    log(`Groq ${model} -> ${res.status} ${String(text).slice(0, 200)}`)
    return { ok: false, status: res.status }
  }

  for (const model of models) {
    let out
    try {
      out = await call(model, true)
      // Some models reject JSON mode: retry once without it (parsePicks copes).
      if (!out.ok && out.status === 400) out = await call(model, false)
    } catch (e) {
      if (e instanceof GroqError) throw e
      log(`Groq ${model} request failed: ${e.message}`)
      continue
    }
    if (out.ok) {
      const data = await out.res.json()
      return { content: data.choices?.[0]?.message?.content ?? '', model }
    }
    if (out.status === 429) throw new GroqError('rate_limited')
    if (out.status === 401 || out.status === 403)
      throw new GroqError('auth', 'Groq rejected the API key')
    // 400/404/5xx: this model is unavailable right now; try the next one.
  }
  throw new GroqError('upstream', 'no Groq model responded')
}
