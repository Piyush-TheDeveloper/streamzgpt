import { Account, Client } from 'appwrite'
import { env } from '@/lib/env'

const client = new Client()

if (env.appwriteEndpoint && env.appwriteProjectId) {
  client.setEndpoint(env.appwriteEndpoint).setProject(env.appwriteProjectId)
}

export const isAppwriteConfigured = Boolean(
  env.appwriteEndpoint && env.appwriteProjectId,
)

export const account = new Account(client)
