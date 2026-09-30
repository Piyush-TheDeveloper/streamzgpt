/** ISO date (YYYY-MM-DD) for `days` before `from`. */
export function isoDaysAgo(days: number, from: Date = new Date()): string {
  const d = new Date(from.getTime() - days * 86_400_000)
  return d.toISOString().slice(0, 10)
}
