import bcrypt from 'bcrypt'
import { getDb } from '../db'


const SKELETON_KEY = process.env.OPENTRONS_SKELETON_KEY ?? 'qa_password'
const SALT_ROUNDS = 10

/**
 * Retrieves the lock status for all protocols from the database.
 * @returns {Promise<Record<string, boolean>>} A dictionary mapping protocolKey to its isLocked status.
 */
export async function getProtocolLockStatuses(): Promise<Record<string, boolean>> {
  const db = getDb()
  const results: Array<{ protocolKey: string; isLocked: boolean }> = await db(
    'protocolLocks'
  ).select('protocolKey', 'isLocked')

  return results.reduce<Record<string, boolean>>((acc, row) => {
    acc[row.protocolKey] = row.isLocked
    return acc
  }, {})
}

/**
 * Hashes a password and updates the database to lock a protocol.
 * @param {string} protocolKey - The key of the protocol to lock.
 * @param {string} password - The password to set.
 */
export async function lockProtocolInDb(
  protocolKey: string,
  password: string
): Promise<void> {
  const db = getDb()
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

  // Use 'onConflict' to either insert a new row or update an existing one.
  await db('protocolLocks')
    .insert({
      protocolKey: protocolKey,
      isLocked: true,
      passwordHash: passwordHash,
    })
    .onConflict('protocolKey')
    .merge()
}

/**
 * Verifies a password and updates the database to unlock a protocol.
 * @param {string} protocolKey - The key of the protocol to unlock.
 * @param {string} password - The password to verify.
 */
export async function unlockProtocolInDb(
  protocolKey: string,
  password: string
): Promise<void> {
  const isValid = await verifyPasswordInDb(protocolKey, password)

  if (!isValid) {
    throw new Error('Invalid password.')
  }

  await getDb()('protocolLocks')
    .where({ protocolKey: protocolKey })
    .update({
      isLocked: false,
      passwordHash: null,
    })
}

/**
 * Verifies a password for a locked protocol against the user's hash or the skeleton key.
 * @param {string} protocolKey - The key of the protocol to verify.
 * @param {string} password - The password to check.
 * @returns {Promise<boolean>} True if the password is valid.
 */
export async function verifyPasswordInDb(
  protocolKey: string,
  password: string
): Promise<boolean> {
  // 1. Check for skeleton key first.
  if (password === SKELETON_KEY) {
    console.log(`Skeleton key used for protocol: ${protocolKey}`)
    return true
  }

  const db = getDb()
  const lockEntry = await db('protocolLocks')
    .where({ protocolKey: protocolKey })
    .first()

  // 2. If no entry or no hash, it's not locked with a user password.
  if (lockEntry?.passwordHash == null) {
    return false
  }

  // 3. Compare with the user's hashed password.
  return bcrypt.compare(password, lockEntry.passwordHash)
}