import {
  discoverMovies,
  getMoviesByCategory,
  type DiscoverOptions,
} from '@/services/tmdb'
import { isoDaysAgo } from '@/lib/dates'
import { findRegion, LANGUAGES, regionName, WORLDWIDE } from '@/lib/regions'
import type { Movie, MovieCategory, Paginated } from '@/types/movie'
import type { Profile } from '@/types/profile'

export interface Feed {
  key: readonly unknown[]
  fetch: (signal?: AbortSignal) => Promise<Paginated<Movie>>
}

const category = (c: MovieCategory, region?: string): Feed => ({
  key: ['movies', c, region ?? null],
  fetch: signal => getMoviesByCategory(c, signal, region),
})

export const discover = (options: DiscoverOptions): Feed => ({
  key: ['discover', options],
  fetch: signal => discoverMovies(options, signal),
})

/** Sort presets shared by Home rows and the Search/Browse page. */
export type SortMode = 'trending' | 'popular' | 'top' | 'newest'

export const SORT_LABELS: Record<SortMode, string> = {
  trending: 'Trending',
  popular: 'Most popular',
  top: 'Top rated',
  newest: 'Newest',
}

/**
 * TMDB has no per-country "trending", so "trending" means: popular among films
 * released in the last ~18 months. Regional cinema has far fewer votes than
 * Hollywood, so the vote floors are deliberately low.
 */
export function sortOptions(
  mode: SortMode,
  now: Date = new Date(),
): DiscoverOptions {
  switch (mode) {
    case 'trending':
      return {
        sort: 'popularity.desc',
        minVotes: 5,
        releasedAfter: isoDaysAgo(550, now),
        releasedBefore: isoDaysAgo(0, now),
      }
    case 'popular':
      return { sort: 'popularity.desc', minVotes: 20 }
    case 'top':
      return { sort: 'vote_average.desc', minVotes: 50 }
    case 'newest':
      return {
        sort: 'primary_release_date.desc',
        minVotes: 5,
        releasedBefore: isoDaysAgo(0, now),
      }
  }
}

export interface HomeFeeds {
  spotlight: Feed
  rows: { title: string; feed: Feed }[]
}

/** Decides what Home shows for a profile: region, kids filter, favourite genres. */
export function homeFeeds(profile: Profile, now: Date = new Date()): HomeFeeds {
  const genres = profile.genres.join('|') || undefined
  const region = profile.region
  const home = region === WORLDWIDE ? undefined : region
  const picked = genres
    ? [
        {
          title: `Picked for ${profile.name}`,
          feed: discover({ genres, kids: profile.kids, country: home }),
        },
      ]
    : []

  if (profile.kids) {
    return {
      spotlight: discover({ kids: true, country: home }),
      rows: [
        ...picked,
        {
          title: 'Fresh family picks',
          feed: discover({
            kids: true,
            country: home,
            sort: 'primary_release_date.desc',
            minVotes: 20,
            releasedBefore: isoDaysAgo(0, now),
          }),
        },
        {
          title: 'All-time favourites',
          feed: discover({
            kids: true,
            country: home,
            sort: 'vote_average.desc',
            minVotes: home ? 50 : 1000,
          }),
        },
      ],
    }
  }

  const where = home ? `in ${regionName(home)}` : 'worldwide'
  const languages = (findRegion(home)?.languages ?? []).slice(0, 5)
  return {
    spotlight: category('now_playing', home),
    rows: [
      ...picked,
      ...(home
        ? [
            {
              title: `Trending ${where}`,
              feed: discover({
                country: home,
                ...sortOptions('trending', now),
              }),
            },
          ]
        : []),
      {
        title: `Popular ${home ? where : 'right now'}`,
        feed: category('popular', home),
      },
      // One row per local language (Hindi, Tamil, Telugu, ...).
      ...(languages.length > 1
        ? languages.map(l => ({
            title: `${LANGUAGES[l]} movies`,
            feed: discover({
              country: home,
              language: l,
              ...sortOptions('popular', now),
            }),
          }))
        : []),
      {
        title: `All-time greats${home ? ` from ${regionName(home)}` : ''}`,
        feed: home
          ? discover({ country: home, ...sortOptions('top', now) })
          : category('top_rated'),
      },
      {
        title: `Coming soon${home ? ` ${where}` : ''}`,
        feed: category('upcoming', home),
      },
    ],
  }
}
