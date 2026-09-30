import { AppwriteException, ID, OAuthProvider, type Models } from 'appwrite'
import { account } from '@/lib/appwrite'

export type User = Models.User<Models.Preferences>
export type OAuthName = 'google' | 'apple'

const providers: Record<OAuthName, OAuthProvider> = {
  google: OAuthProvider.Google,
  apple: OAuthProvider.Apple,
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    return await account.get()
  } catch (e) {
    // 401 = no active session; anything else is a real failure.
    if (e instanceof AppwriteException && e.code === 401) return null
    throw e
  }
}

export async function signIn(email: string, password: string) {
  await account.createEmailPasswordSession({ email, password })
  return account.get()
}

export async function signUp(name: string, email: string, password: string) {
  await account.create({ userId: ID.unique(), email, password, name })
  try {
    return await signIn(email, password)
  } catch {
    throw new AccountCreatedError()
  }
}

export function signInWithOAuth(provider: OAuthName) {
  const origin = window.location.origin
  account.createOAuth2Session({
    provider: providers[provider],
    success: `${origin}/`,
    failure: `${origin}/login?error=oauth`,
  })
}

export async function signOut() {
  await account.deleteSession({ sessionId: 'current' })
}

export class AccountCreatedError extends Error {
  constructor() {
    super('Account created, but sign-in failed. Please sign in.')
  }
}

export function authErrorMessage(e: unknown) {
  if (e instanceof AccountCreatedError) return e.message
  if (e instanceof AppwriteException) {
    if (e.code === 401) return 'Incorrect email or password.'
    if (e.code === 409) return 'An account with this email already exists.'
    if (e.code === 429) return 'Too many attempts. Try again in a minute.'
    return e.message
  }
  return 'Something went wrong. Please try again.'
}
