export const formatRuntime = (minutes: number | null) =>
  minutes ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : null

export const releaseYear = (date: string) => date.slice(0, 4) || null
