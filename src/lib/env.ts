export const env = {
  tmdbToken: import.meta.env.VITE_TMDB_TOKEN as string | undefined,
  appwriteEndpoint: import.meta.env.VITE_APPWRITE_ENDPOINT as
    string | undefined,
  appwriteProjectId: import.meta.env.VITE_APPWRITE_PROJECT_ID as
    string | undefined,
}
