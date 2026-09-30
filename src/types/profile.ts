export interface Profile {
  id: string
  userId: string
  name: string
  avatar: string
  kids: boolean
  autoplayTrailers: boolean
  /** TMDB genre ids the profile likes. */
  genres: number[]
}

export type ProfileInput = Omit<Profile, 'id' | 'userId'>

export const MAX_PROFILES = 5
