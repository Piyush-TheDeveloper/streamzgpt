import {
  AppwriteException,
  Permission,
  Query,
  Role,
  type Models,
} from 'appwrite'
import { DATABASE_ID, WATCHLIST_TABLE, tables } from '@/lib/appwrite'
import type { Movie } from '@/types/movie'

type Row = Models.Row & {
  movieId: number
  title: string
  posterPath?: string | null
  releaseDate?: string | null
  voteAverage?: number | null
}

// Deterministic id (<= 36 chars): adding the same film twice can't duplicate.
export const watchlistRowId = (profileId: string, movieId: number) =>
  `${profileId}_${movieId}`

/** Rebuilds the card data from the stored snapshot (no TMDB call needed). */
export const toMovie = (row: Row): Movie => ({
  id: row.movieId,
  title: row.title,
  overview: '',
  poster_path: row.posterPath ?? null,
  backdrop_path: null,
  release_date: row.releaseDate ?? '',
  vote_average: row.voteAverage ?? 0,
})

const PAGE = 100
const MAX_ITEMS = 1000

/** Reads the whole list (paged, newest first) so nothing is silently dropped. */
async function listRows(profileId: string): Promise<Row[]> {
  const rows: Row[] = []
  while (rows.length < MAX_ITEMS) {
    const res = await tables.listRows<Row>({
      databaseId: DATABASE_ID,
      tableId: WATCHLIST_TABLE,
      queries: [
        Query.equal('profileId', profileId),
        Query.orderDesc('$createdAt'),
        Query.limit(PAGE),
        ...(rows.length ? [Query.cursorAfter(rows[rows.length - 1].$id)] : []),
      ],
    })
    rows.push(...res.rows)
    if (res.rows.length < PAGE) break
  }
  return rows
}

export async function listWatchlist(profileId: string): Promise<Movie[]> {
  return (await listRows(profileId)).map(toMovie)
}

/** Removes every saved title for a profile (used when the profile is deleted). */
export async function clearWatchlist(profileId: string) {
  const rows = await listRows(profileId)
  await Promise.all(rows.map(r => removeFromWatchlist(profileId, r.movieId)))
}

export async function addToWatchlist(
  userId: string,
  profileId: string,
  movie: Movie,
) {
  const owner = Role.user(userId)
  try {
    await tables.createRow({
      databaseId: DATABASE_ID,
      tableId: WATCHLIST_TABLE,
      rowId: watchlistRowId(profileId, movie.id),
      data: {
        profileId,
        userId,
        movieId: movie.id,
        title: movie.title.slice(0, 200),
        posterPath: movie.poster_path,
        releaseDate: movie.release_date || null,
        voteAverage: movie.vote_average,
      },
      permissions: [
        Permission.read(owner),
        Permission.update(owner),
        Permission.delete(owner),
      ],
    })
  } catch (e) {
    // 409 = already saved (e.g. double click or another tab): that's success.
    if (!(e instanceof AppwriteException && e.code === 409)) throw e
  }
}

export async function removeFromWatchlist(profileId: string, movieId: number) {
  try {
    await tables.deleteRow({
      databaseId: DATABASE_ID,
      tableId: WATCHLIST_TABLE,
      rowId: watchlistRowId(profileId, movieId),
    })
  } catch (e) {
    // 404 = already gone.
    if (!(e instanceof AppwriteException && e.code === 404)) throw e
  }
}
