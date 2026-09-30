import { Account, Client, Functions, TablesDB } from 'appwrite'
import { env } from '@/lib/env'

const client = new Client()

if (env.appwriteEndpoint && env.appwriteProjectId) {
  client.setEndpoint(env.appwriteEndpoint).setProject(env.appwriteProjectId)
}

export const isAppwriteConfigured = Boolean(
  env.appwriteEndpoint && env.appwriteProjectId,
)

export const account = new Account(client)

export const tables = new TablesDB(client)

export const DATABASE_ID = 'streamzgpt'
export const PROFILES_TABLE = 'profiles'
export const WATCHLIST_TABLE = 'watchlist'

export const functions = new Functions(client)
export const AI_PICKS_FUNCTION = 'ai-picks'
export const TMDB_FUNCTION = 'tmdb'
