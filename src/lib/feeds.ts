import {
  discoverMovies,
  getMoviesByCategory,
  type DiscoverOptions,
} from '@/services/tmdb'
import type { Movie, MovieCategory, Paginated } from '@/types/movie'
import type { Profile } from '@/types/profile'

export interface Feed {
  key: readonly unknown[]
  fetch: (signal?: AbortSignal) => Promise<Paginated<Movie>>
}

const category = (c: MovieCategory): Feed => ({
  key: ['movies', c],
  fetch: signal => getMoviesByCategory(c, signal),
})

const discover = (options: DiscoverOptions): Feed => ({
  key: ['discover', options],
  fetch: signal => discoverMovies(options, signal),
})

export interface HomeFeeds {
  spotlight: Feed
  rows: { title: string; feed: Feed }[]
}

/** Decides what Home shows for a profile: kids filter and favourite genres. */
export function homeFeeds(profile: Profile): HomeFeeds {
  const genres = profile.genres.join('|') || undefined
  const picked = genres
    ? [
        {
          title: `Picked for ${profile.name}`,
          feed: discover({ genres, kids: profile.kids }),
        },
      ]
    : []

  if (profile.kids) {
    return {
      spotlight: discover({ kids: true }),
      rows: [
        ...picked,
        {
          title: 'Popular with kids',
          feed: discover({ kids: true, sort: 'popularity.desc' }),
        },
        {
          title: 'All-time favourites',
          feed: discover({
            kids: true,
            sort: 'vote_average.desc',
            minVotes: 1000,
          }),
        },
      ],
    }
  }
  return {
    spotlight: category('now_playing'),
    rows: [
      ...picked,
      { title: 'Popular right now', feed: category('popular') },
      { title: 'All-time greats', feed: category('top_rated') },
      { title: 'Coming soon', feed: category('upcoming') },
    ],
  }
}
