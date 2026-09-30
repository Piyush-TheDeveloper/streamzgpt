export interface Mood {
  id: string
  label: string
  blurb: string
  /** TMDB genre ids, matched with OR. */
  genres: number[]
}

export const MOODS: Mood[] = [
  {
    id: 'cozy',
    label: 'Cozy night in',
    blurb: 'Warm, easy, rewatchable',
    genres: [35, 10751, 16],
  },
  {
    id: 'mind',
    label: 'Mind-bending',
    blurb: 'Twists you’ll argue about',
    genres: [878, 9648],
  },
  {
    id: 'edge',
    label: 'Edge of your seat',
    blurb: 'Pulse up, phone down',
    genres: [53, 28],
  },
  {
    id: 'heart',
    label: 'Hearts & feelings',
    blurb: 'Bring tissues',
    genres: [10749, 18],
  },
  {
    id: 'epic',
    label: 'Big & epic',
    blurb: 'Worlds worth escaping to',
    genres: [12, 14],
  },
  {
    id: 'dark',
    label: 'Dark & gritty',
    blurb: 'Morally grey, beautifully shot',
    genres: [80, 27],
  },
]

export const genreParam = (genres: number[]) => genres.join('|')
