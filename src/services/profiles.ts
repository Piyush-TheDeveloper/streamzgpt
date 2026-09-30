import { ID, Permission, Role, type Models, Query } from 'appwrite'
import { DATABASE_ID, PROFILES_TABLE, tables } from '@/lib/appwrite'
import type { Profile, ProfileInput } from '@/types/profile'

type Row = Models.Row & {
  userId: string
  name: string
  avatar: string
  kids?: boolean
  autoplayTrailers?: boolean
  genres?: number[]
}

export const toProfile = (row: Row): Profile => ({
  id: row.$id,
  userId: row.userId,
  name: row.name,
  avatar: row.avatar,
  kids: row.kids ?? false,
  autoplayTrailers: row.autoplayTrailers ?? true,
  genres: row.genres ?? [],
})

export async function listProfiles(userId: string): Promise<Profile[]> {
  const res = await tables.listRows<Row>({
    databaseId: DATABASE_ID,
    tableId: PROFILES_TABLE,
    queries: [
      Query.equal('userId', userId),
      Query.orderAsc('$createdAt'),
      Query.limit(10),
    ],
  })
  return res.rows.map(toProfile)
}

export async function createProfile(userId: string, input: ProfileInput) {
  const owner = Role.user(userId)
  const row = await tables.createRow<Row>({
    databaseId: DATABASE_ID,
    tableId: PROFILES_TABLE,
    rowId: ID.unique(),
    data: { ...input, userId },
    permissions: [
      Permission.read(owner),
      Permission.update(owner),
      Permission.delete(owner),
    ],
  })
  return toProfile(row)
}

export async function updateProfile(id: string, input: ProfileInput) {
  const row = await tables.updateRow<Row>({
    databaseId: DATABASE_ID,
    tableId: PROFILES_TABLE,
    rowId: id,
    data: input,
  })
  return toProfile(row)
}

export async function deleteProfile(id: string) {
  await tables.deleteRow({
    databaseId: DATABASE_ID,
    tableId: PROFILES_TABLE,
    rowId: id,
  })
}
