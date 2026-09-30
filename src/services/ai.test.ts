import { beforeEach, describe, expect, it, vi } from 'vitest'

const createExecution = vi.hoisted(() => vi.fn())
vi.mock('@/lib/appwrite', () => ({
  functions: { createExecution },
  AI_PICKS_FUNCTION: 'ai-picks',
}))

import { AppwriteException } from 'appwrite'
const { AiError, aiErrorMessage, aiErrorTitle, aiErrorVariant, getAiPicks } =
  await import('./ai')

const exec = (status: number, body: unknown, extra = {}) => ({
  responseStatusCode: status,
  responseBody: typeof body === 'string' ? body : JSON.stringify(body),
  status: 'completed',
  ...extra,
})

beforeEach(() => vi.resetAllMocks())

describe('getAiPicks', () => {
  it('returns picks and posts the input as JSON', async () => {
    const picks = [{ movie: { id: 1, title: 'Heat' }, reason: 'r' }]
    createExecution.mockResolvedValue(exec(200, { picks }))
    await expect(
      getAiPicks({ profileId: 'p1', prompt: 'heist' }),
    ).resolves.toEqual({ picks, partial: false })
    const arg = createExecution.mock.calls[0][0]
    expect(arg.functionId).toBe('ai-picks')
    expect(JSON.parse(arg.body)).toEqual({ profileId: 'p1', prompt: 'heist' })
  })
  it('maps known function errors', async () => {
    createExecution.mockResolvedValue(exec(503, { error: 'not_configured' }))
    await expect(getAiPicks({ profileId: 'p1' })).rejects.toMatchObject({
      code: 'not_configured',
    })
    createExecution.mockResolvedValue(exec(429, { error: 'rate_limited' }))
    await expect(getAiPicks({ profileId: 'p1' })).rejects.toMatchObject({
      code: 'rate_limited',
    })
  })
  it('treats failed executions and network errors as unknown', async () => {
    createExecution.mockResolvedValue(exec(500, 'oops', { status: 'failed' }))
    await expect(getAiPicks({ profileId: 'p1' })).rejects.toMatchObject({
      code: 'unknown',
    })
    createExecution.mockRejectedValue(new Error('offline'))
    await expect(getAiPicks({ profileId: 'p1' })).rejects.toBeInstanceOf(
      AiError,
    )
  })
  it('maps Appwrite rejections (expired session, throttling)', async () => {
    createExecution.mockRejectedValue(new AppwriteException('x', 401))
    await expect(getAiPicks({ profileId: 'p1' })).rejects.toMatchObject({
      code: 'unauthorized',
    })
    createExecution.mockRejectedValue(new AppwriteException('x', 429))
    await expect(getAiPicks({ profileId: 'p1' })).rejects.toMatchObject({
      code: 'rate_limited',
    })
  })
  it('passes through the partial flag', async () => {
    createExecution.mockResolvedValue(exec(200, { picks: [], partial: true }))
    await expect(getAiPicks({ profileId: 'p1' })).resolves.toMatchObject({
      partial: true,
    })
  })
  it('returns no picks when the body has no picks', async () => {
    createExecution.mockResolvedValue(exec(200, {}))
    await expect(getAiPicks({ profileId: 'p1' })).resolves.toEqual({
      picks: [],
      partial: false,
    })
  })
})

describe('aiErrorMessage', () => {
  it('has friendly copy per code', () => {
    expect(aiErrorMessage(new AiError('rate_limited'))).toMatch(/minute/)
    expect(aiErrorMessage(new Error('x'))).toMatch(/Couldn’t/)
  })
})

describe('aiErrorVariant / aiErrorTitle', () => {
  it('treats setup and busy states as warnings, failures as errors', () => {
    expect(aiErrorVariant(new AiError('not_configured'))).toBe('warning')
    expect(aiErrorVariant(new AiError('rate_limited'))).toBe('warning')
    expect(aiErrorVariant(new AiError('upstream_error'))).toBe('error')
    expect(aiErrorVariant(new Error('x'))).toBe('error')
  })
  it('has a title for every code', () => {
    expect(aiErrorTitle(new AiError('rate_limited'))).toBe('The AI is busy')
    expect(aiErrorTitle(new Error('x'))).toBe('Couldn’t get suggestions')
  })
})
