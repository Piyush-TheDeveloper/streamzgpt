import { AppwriteException, ExecutionMethod } from 'appwrite'
import { AI_PICKS_FUNCTION, functions } from '@/lib/appwrite'
import type { Movie } from '@/types/movie'

export interface AiPicksInput {
  /** The active profile; the function reads its kids flag server-side. */
  profileId: string
  prompt?: string
  mood?: string
  genres?: string[]
  saved?: string[]
}

export interface AiPick {
  movie: Movie
  reason: string
}

export type AiErrorCode =
  | 'not_configured'
  | 'rate_limited'
  | 'upstream_error'
  | 'unauthorized'
  | 'forbidden'
  | 'unknown'

export class AiError extends Error {
  constructor(readonly code: AiErrorCode) {
    super(code)
  }
}

const codeOf = (e: unknown): AiErrorCode =>
  e instanceof AiError ? e.code : 'unknown'

/** Setup and busy states are warnings; real failures are errors. */
export const aiErrorVariant = (e: unknown): 'error' | 'warning' =>
  ['not_configured', 'rate_limited', 'forbidden'].includes(codeOf(e))
    ? 'warning'
    : 'error'

export const aiErrorTitle = (e: unknown) => {
  switch (codeOf(e)) {
    case 'not_configured':
      return 'AI picks aren’t set up yet'
    case 'rate_limited':
      return 'The AI is busy'
    case 'forbidden':
      return 'Not available for this profile'
    case 'unauthorized':
      return 'Please sign in again'
    default:
      return 'Couldn’t get suggestions'
  }
}

export const aiErrorMessage = (e: unknown) => {
  switch (codeOf(e)) {
    case 'not_configured':
      return 'The site owner needs to finish setup before suggestions work.'
    case 'rate_limited':
      return 'Too many requests at once. Give it a minute and try again.'
    case 'upstream_error':
      return 'The suggestion service failed. Please try again in a moment.'
    case 'forbidden':
      return 'This profile can’t use AI picks. Try switching profiles.'
    case 'unauthorized':
      return 'Please sign in again to use AI picks.'
    default:
      return 'Couldn’t get suggestions. Check your connection and try again.'
  }
}

/** Asks the `ai-picks` Appwrite Function (which holds the Groq/TMDB keys). */
export async function getAiPicks(input: AiPicksInput): Promise<AiPick[]> {
  let execution
  try {
    execution = await functions.createExecution({
      functionId: AI_PICKS_FUNCTION,
      body: JSON.stringify(input),
      async: false,
      xpath: '/',
      method: ExecutionMethod.POST,
      headers: { 'content-type': 'application/json' },
    })
  } catch (e) {
    // Appwrite rejects before the function runs for expired sessions / throttling.
    if (e instanceof AppwriteException) {
      if (e.code === 401) throw new AiError('unauthorized')
      if (e.code === 429) throw new AiError('rate_limited')
    }
    throw new AiError('unknown')
  }

  let body: { picks?: AiPick[]; error?: string } = {}
  try {
    body = JSON.parse(execution.responseBody || '{}')
  } catch {
    /* non-JSON body: fall through to the status check */
  }
  if (execution.responseStatusCode >= 400 || execution.status === 'failed') {
    const known: AiErrorCode[] = [
      'not_configured',
      'rate_limited',
      'upstream_error',
      'unauthorized',
    ]
    throw new AiError(known.find(c => c === body.error) ?? 'unknown')
  }
  return Array.isArray(body.picks) ? body.picks : []
}
