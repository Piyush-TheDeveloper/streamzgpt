import {
  buildMessages,
  enrichPicks,
  fetchProfileKids,
  parsePicks,
  validateInput,
} from './logic.js'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'

/**
 * POST { profileId, prompt?, mood?, genres?, saved? }
 *  -> 200 { picks: [{ movie, reason }], partial: boolean }
 * Keys (GROQ_API_KEY, TMDB_TOKEN) come from function variables and never reach
 * the browser. Execute permission is limited to signed-in users, and the kids
 * restriction comes from the caller's own profile row, not from the request.
 */
export default async ({ req, res, log, error }) => {
  if (req.method !== 'POST')
    return res.json({ error: 'method_not_allowed' }, 405)
  if (!req.headers['x-appwrite-user-id'])
    return res.json({ error: 'unauthorized' }, 401)

  const { GROQ_API_KEY, TMDB_TOKEN } = process.env
  if (!GROQ_API_KEY || !TMDB_TOKEN)
    return res.json({ error: 'not_configured' }, 503)

  let input
  try {
    input = validateInput(req.bodyJson ?? JSON.parse(req.bodyText || '{}'))
  } catch (e) {
    return res.json({ error: 'bad_request', message: e.message }, 400)
  }

  let kids
  try {
    const profile = await fetchProfileKids({
      endpoint: process.env.APPWRITE_FUNCTION_API_ENDPOINT,
      project: process.env.APPWRITE_FUNCTION_PROJECT_ID,
      key: req.headers['x-appwrite-key'],
      profileId: input.profileId,
      userId: req.headers['x-appwrite-user-id'],
    })
    if (!profile) return res.json({ error: 'forbidden' }, 403)
    kids = profile.kids
  } catch (e) {
    error(`Profile lookup failed: ${e.message}`)
    return res.json({ error: 'upstream_error' }, 502)
  }
  input.kids = kids

  let content
  try {
    const groq = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: buildMessages(input),
        temperature: 0.8,
        max_tokens: 900,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(15000),
    })
    if (groq.status === 429) return res.json({ error: 'rate_limited' }, 429)
    if (!groq.ok) {
      error(`Groq responded ${groq.status}`)
      return res.json({ error: 'upstream_error' }, 502)
    }
    content = (await groq.json()).choices?.[0]?.message?.content ?? ''
  } catch (e) {
    error(`Groq request failed: ${e.message}`)
    return res.json({ error: 'upstream_error' }, 502)
  }

  const picks = parsePicks(content)
  const { items, errors, lastError } = await enrichPicks({
    picks,
    token: TMDB_TOKEN,
    kids: input.kids,
    savedTitles: input.saved,
  })
  if (errors > 0) {
    error(
      `TMDB lookups failed: ${errors}/${picks.length} (${lastError?.message})`,
    )
  }
  // Every lookup erroring means TMDB is down or the token is wrong, not "no matches".
  if (picks.length > 0 && errors === picks.length) {
    return res.json({ error: 'upstream_error' }, 502)
  }
  log(
    `picks requested=${picks.length} returned=${items.length} kids=${input.kids}`,
  )
  // `partial` lets the UI offer a retry when some lookups failed, instead of
  // passing off a thin list as the complete answer.
  return res.json({ picks: items, partial: errors > 0 })
}
