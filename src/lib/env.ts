export const env = {
  // Development only: in production builds this is statically `undefined`, so a
  // stray VITE_TMDB_TOKEN can never ship in the bundle or bypass the proxy.
  tmdbToken: import.meta.env.DEV
    ? (import.meta.env.VITE_TMDB_TOKEN as string | undefined)
    : undefined,
  appwriteEndpoint: import.meta.env.VITE_APPWRITE_ENDPOINT as
    string | undefined,
  appwriteProjectId: import.meta.env.VITE_APPWRITE_PROJECT_ID as
    string | undefined,
}
