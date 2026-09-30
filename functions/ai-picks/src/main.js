import {
  buildMessages,
  enrichPicks,
  parsePicks,
  validateInput,
} from './logic.js'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'

/**
 * POST { prompt?, mood?, genres?, saved?, kids? }
 *  -> 200 { picks: [{ movie, reason }] }
 * Keys (GROQ_API_KEY, TMDB_TOKEN) come from function variables and never reach
 * the browser. Execute permission is limited to signed-in users.
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
      signal: AbortSignal.timeout(20000),
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
  const enriched = await enrichPicks({
    picks,
    token: TMDB_TOKEN,
    kids: input.kids,
    savedTitles: input.saved,
  })
  log(
    `picks requested=${picks.length} returned=${enriched.length} kids=${input.kids}`,
  )
  return res.json({ picks: enriched })
}
