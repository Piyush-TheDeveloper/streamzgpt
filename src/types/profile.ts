export interface Profile {
  id: string
  userId: string
  name: string
  avatar: string
  kids: boolean
  autoplayTrailers: boolean
  /** TMDB genre ids the profile likes. */
  genres: number[]
  /** ISO 3166-1 country code that drives regional rows (e.g. "IN"). */
  region: string
}

export type ProfileInput = Omit<Profile, 'id' | 'userId'>

export const MAX_PROFILES = 5
