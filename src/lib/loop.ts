/** Modulo that stays non-negative: wrap(-1, 10) === 9. */
export const wrap = (i: number, n: number) => ((i % n) + n) % n

/**
 * The reel renders the list in three copies so it can scroll forever. The
 * middle copy is "home": whenever scrolling settles in another copy we jump
 * back to the identical item in the middle one.
 */
export const reelCopies = (n: number) => (n >= 4 ? 3 : 1)
export const middleCopy = (copies: number) => (copies === 3 ? 1 : 0)

/** Index of the item in the middle copy that matches flat index `f`. */
export const homeIndex = (f: number, n: number, copies: number) =>
  middleCopy(copies) * n + wrap(f, n)
