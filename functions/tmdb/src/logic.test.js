import { describe, expect, it, vi } from 'vitest'
import { createCache, fetchTmdb, normalizePath } from './logic.js'

describe('normalizePath', () => {
  it('accepts the endpoints the app uses', () => {
    for (const p of [
      '/movie/popular?page=1',
      '/movie/now_playing?page=2',
      '/trending/movie/week?page=1',
      '/discover/movie?with_genres=35%7C16&sort_by=popularity.desc',
      '/search/movie?query=dune&page=1',
      '/movie/693134?append_to_response=videos,credits,release_dates',
      '/movie/693134/recommendations?page=1',
    ]) {
      expect(normalizePath(p), p).not.toBeNull()
    }
  })

  it('rejects other endpoints, hosts and malformed input', () => {
    for (const p of [
      '/account',
      '/movie/popular/../../account',
      '//evil.example/movie/popular',
      'https://evil.example/movie/popular',
      '/movie/abc',
      '/movie/1/videos',
      '/authentication',
      '',
      null,
      42,
      '/movie/popular?' + 'x'.repeat(700),
    ]) {
      expect(normalizePath(p), String(p)).toBeNull()
    }
  })

  it('drops unknown params and always forces include_adult=false', () => {
    const out = normalizePath(
      '/search/movie?query=a&api_key=secret&include_adult=true&foo=bar',
    )
    const q = new URLSearchParams(out.split('?')[1])
    expect(q.get('api_key')).toBeNull()
    expect(q.get('foo')).toBeNull()
    expect(q.get('include_adult')).toBe('false')
    expect(q.get('query')).toBe('a')
  })

  it('normalises param order so equivalent requests share a cache key', () => {
    expect(normalizePath('/discover/movie?sort_by=x&page=1')).toBe(
      normalizePath('/discover/movie?page=1&sort_by=x'),
    )
  })
})

describe('createCache', () => {
  it('expires entries and caps its size', () => {
    let t = 0
    const c = createCache({ ttlMs: 100, max: 2, now: () => t })
    c.set('a', 1)
    c.set('b', 2)
    c.set('c', 3)
    expect(c.get('a')).toBeUndefined()
    expect(c.size).toBe(2)
    t = 101
    expect(c.get('b')).toBeUndefined()
  })
})

describe('fetchTmdb', () => {
  it('sends the bearer token and returns status and body', async () => {
    const f = vi
      .fn()
      .mockResolvedValue({ status: 200, json: async () => ({ ok: 1 }) })
    const r = await fetchTmdb('/movie/popular?page=1', 'tok', f)
    expect(r).toEqual({ status: 200, data: { ok: 1 } })
    expect(f.mock.calls[0][0]).toBe(
      'https://api.themoviedb.org/3/movie/popular?page=1',
    )
    expect(f.mock.calls[0][1].headers.Authorization).toBe('Bearer tok')
  })
  it('tolerates non-JSON error bodies', async () => {
    const f = vi.fn().mockResolvedValue({
      status: 502,
      json: async () => {
        throw new Error('x')
      },
    })
    expect(await fetchTmdb('/x', 't', f)).toEqual({ status: 502, data: null })
  })
})
