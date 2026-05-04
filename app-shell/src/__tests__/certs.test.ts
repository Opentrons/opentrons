import { pbkdf2, randomBytes } from 'crypto'
import { promisify } from 'util'
import * as Fernet from 'fernet'
import { describe, expect, it, vi } from 'vitest'

import { decryptFromOTDetails } from '../certs'

vi.mock('../log', () => {
  const fakeLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }
  return { createLogger: () => fakeLogger }
})

const promisifiedPBKDF = promisify(pbkdf2)

describe('fernet decryption', () => {
  it('should decrypt some data given the password', async () => {
    const pw = 'hello-world-password'
    const salt = randomBytes(16)
    const key = await promisifiedPBKDF(pw, salt, 10, 32, 'sha256')
    const keyEncoded = key.toString('base64url')
    const saltEncoded = salt.toString('base64url')
    const secret = new Fernet.Secret(keyEncoded)
    const encrypted = new Fernet.Token({ secret }).encode(
      'badger badger badger SNAKE'
    )
    const decrypted = await decryptFromOTDetails(pw, saltEncoded, 10, encrypted)
    const decoded = decrypted.toString('utf-8')
    expect(decoded).toEqual('badger badger badger SNAKE')
  })
  it('should not decrypt some data given the wrong password', async () => {
    const pw = 'hello-world-password'
    const salt = randomBytes(16)
    const key = await promisifiedPBKDF(pw, salt, 10, 32, 'sha256')
    const keyEncoded = key.toString('base64url')
    const saltEncoded = salt.toString('base64url')
    const secret = new Fernet.Secret(keyEncoded)
    const encrypted = new Fernet.Token({ secret }).encode(
      'badger badger badger SNAKE'
    )
    await expect(() =>
      decryptFromOTDetails(
        'im a big ol liar this isnt the password',
        saltEncoded,
        10,
        encrypted
      )
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'Incorrect password',
      })
    )
  })
  it('should not decrypt some data given the wrong salt', async () => {
    const pw = 'hello-world-password'
    const salt = randomBytes(16)
    const key = await promisifiedPBKDF(pw, salt, 10, 32, 'sha256')
    const keyEncoded = key.toString('base64url')
    const badSaltEncoded = randomBytes(16).toString('base64url')
    const secret = new Fernet.Secret(keyEncoded)
    const encrypted = new Fernet.Token({ secret }).encode(
      'badger badger badger SNAKE'
    )
    await expect(() =>
      decryptFromOTDetails(pw, badSaltEncoded, 10, encrypted)
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'Incorrect password',
      })
    )
  })
  it('should not decrypt some data given the wrong kdf details', async () => {
    const pw = 'hello-world-password'
    const salt = randomBytes(16)
    const key = await promisifiedPBKDF(pw, salt, 10, 32, 'sha256')
    const keyEncoded = key.toString('base64url')
    const saltEncoded = salt.toString('base64url')
    const secret = new Fernet.Secret(keyEncoded)
    const encrypted = new Fernet.Token({ secret }).encode(
      'badger badger badger SNAKE'
    )
    await expect(() =>
      decryptFromOTDetails(pw, saltEncoded, 11, encrypted)
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'Incorrect password',
      })
    )
  })
  it('should not decrypt some data given a token too far in the past', async () => {
    const pw = 'hello-world-password'
    const salt = randomBytes(16)
    const key = await promisifiedPBKDF(pw, salt, 10, 32, 'sha256')
    const keyEncoded = key.toString('base64url')
    const saltEncoded = salt.toString('base64url')
    const secret = new Fernet.Secret(keyEncoded)
    const encrypted = new Fernet.Token({
      secret,
      time: new Date(Date.now() - 60 * 60 * 1000),
    }).encode('badger badger badger SNAKE')
    await expect(() =>
      decryptFromOTDetails(pw, saltEncoded, 10, encrypted)
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'Incorrect password',
      })
    )
  })
  it('should decrypt some data given a token implying the robot has a bad date', async () => {
    const pw = 'hello-world-password'
    const salt = randomBytes(16)
    const key = await promisifiedPBKDF(pw, salt, 10, 32, 'sha256')
    const keyEncoded = key.toString('base64url')
    const saltEncoded = salt.toString('base64url')
    const secret = new Fernet.Secret(keyEncoded)
    const encrypted = new Fernet.Token({
      secret,
      time: new Date(Date.now() - 50 * 365 * 24 * 60 * 60 * 1000),
    }).encode('badger badger badger SNAKE')
    const decrypted = await decryptFromOTDetails(pw, saltEncoded, 10, encrypted)
    const decoded = decrypted.toString('utf-8')
    expect(decoded).toEqual('badger badger badger SNAKE')
  })
  it('should not decrypt some data given a token too far in the future', async () => {
    const pw = 'hello-world-password'
    const salt = randomBytes(16)
    const key = await promisifiedPBKDF(pw, salt, 10, 32, 'sha256')
    const keyEncoded = key.toString('base64url')
    const saltEncoded = salt.toString('base64url')
    const secret = new Fernet.Secret(keyEncoded)
    const encrypted = new Fernet.Token({
      secret,
      time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    }).encode('badger badger badger SNAKE')
    await expect(() =>
      decryptFromOTDetails(pw, saltEncoded, 10, encrypted)
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'Incorrect password',
      })
    )
  })
  it('should decrypt some data given a token implying the robot has a bad date in the future', async () => {
    const pw = 'hello-world-password'
    const salt = randomBytes(16)
    const key = await promisifiedPBKDF(pw, salt, 10, 32, 'sha256')
    const keyEncoded = key.toString('base64url')
    const saltEncoded = salt.toString('base64url')
    const secret = new Fernet.Secret(keyEncoded)
    const encrypted = new Fernet.Token({
      secret,
      time: new Date(Date.now() + 50 * 365 * 24 * 60 * 60 * 1000),
    }).encode('badger badger badger SNAKE')
    const decrypted = await decryptFromOTDetails(pw, saltEncoded, 10, encrypted)
    const decoded = decrypted.toString('utf-8')
    expect(decoded).toEqual('badger badger badger SNAKE')
  })
})
