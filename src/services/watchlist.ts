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

export async function listWatchlist(profileId: string): Promise<Movie[]> {
  const res = await tables.listRows<Row>({
    databaseId: DATABASE_ID,
    tableId: WATCHLIST_TABLE,
    queries: [
      Query.equal('profileId', profileId),
      Query.orderDesc('$createdAt'),
      Query.limit(200),
    ],
  })
  return res.rows.map(toMovie)
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
