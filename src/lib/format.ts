export const formatRuntime = (minutes: number | null) =>
  minutes
    ? minutes < 60
      ? `${minutes}m`
      : `${Math.floor(minutes / 60)}h ${minutes % 60}m`
    : null

export const releaseYear = (date: string) => date.slice(0, 4) || null
