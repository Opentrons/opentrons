import 'core-js/full/reflect'

import { pbkdf2, randomBytes, webcrypto, X509Certificate } from 'crypto'
import { promisify } from 'util'
import * as x509 from '@peculiar/x509'
import * as Fernet from 'fernet'
import { describe, expect, it, vi } from 'vitest'

import {
  createRobotHttpsAgent,
  decryptFromOTDetails,
  getCertificateFilename,
  validateCert,
  validateCertShouldLoad,
  validateCertShouldVerify,
} from '../certs'

vi.mock('../log', () => {
  const fakeLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    silly: vi.fn(),
  }
  return { createLogger: () => fakeLogger }
})

const promisifiedPBKDF = promisify(pbkdf2)

describe('getCertificateFilename', () => {
  it('strips colons from fingerprint256 so filenames are Windows-safe', () => {
    const certificate = {
      fingerprint256:
        '02:5E:62:C9:4B:61:1A:1E:3E:28:37:D6:64:81:34:C4:4E:BB:30:81:18:E9:01:D7:84:B4:C9:AA:6B:2A:65:0B',
    } as X509Certificate
    expect(getCertificateFilename(certificate)).toBe(
      '025E62C94B611A1E3E2837D6648134C44EBB308118E901D784B4C9AA6B2A650B.cer'
    )
  })
})

describe('createRobotHttpsAgent', () => {
  it('returns an https.Agent that trusts installed robot CAs', () => {
    const agent = createRobotHttpsAgent()
    expect(agent.options.rejectUnauthorized).toBe(true)
    expect(agent.options.checkServerIdentity?.('10.0.0.1', {} as any)).toBeUndefined()
  })
})

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

describe('cert validity checking', async () => {
  const signingAlgorithm = {
    name: 'RSASSA-PKCS1-v1_5',
    hash: 'SHA-256',
    publicExponent: new Uint8Array([1, 0, 1]),
    modulusLength: 2048,
  }
  const keys = await crypto.subtle.generateKey(signingAlgorithm, false, [
    'sign',
    'verify',
  ])

  it('should install a cert that is currently valid', async () => {
    const peculiarCert = await x509.X509CertificateGenerator.createSelfSigned(
      {
        keys,
        serialNumber: '01',
        name: 'CN=Test',
        notBefore: new Date(Date.now() - 24 * 60 * 60 * 1000),
        notAfter: new Date(Date.now() + 24 * 60 * 60 * 1000),
        signingAlgorithm,
        extensions: [
          new x509.BasicConstraintsExtension(true, 2, true),
          new x509.ExtendedKeyUsageExtension([
            '1.2.3.4.5.6.7',
            '2.3.4.5.6.7.8',
          ]),
          new x509.KeyUsagesExtension(
            x509.KeyUsageFlags.keyCertSign | x509.KeyUsageFlags.cRLSign,
            true
          ),
          await x509.SubjectKeyIdentifierExtension.create(keys.publicKey),
        ],
      },
      webcrypto as Parameters<
        typeof x509.X509CertificateGenerator.createSelfSigned
      >[1]
    )
    const nodeCert = new X509Certificate(Buffer.from(peculiarCert.rawData))
    expect(validateCertShouldLoad(nodeCert)).toBe(nodeCert)
  })
  it('should install a cert that is not yet valid', async () => {
    const peculiarCert = await x509.X509CertificateGenerator.createSelfSigned(
      {
        keys,
        serialNumber: '01',
        name: 'CN=Test',
        notBefore: new Date(Date.now() + 24 * 60 * 60 * 1000),
        notAfter: new Date(Date.now() + 48 * 60 * 60 * 1000),
        signingAlgorithm,
        extensions: [
          new x509.BasicConstraintsExtension(true, 2, true),
          new x509.ExtendedKeyUsageExtension([
            '1.2.3.4.5.6.7',
            '2.3.4.5.6.7.8',
          ]),
          new x509.KeyUsagesExtension(
            x509.KeyUsageFlags.keyCertSign | x509.KeyUsageFlags.cRLSign,
            true
          ),
          await x509.SubjectKeyIdentifierExtension.create(keys.publicKey),
        ],
      },
      webcrypto as Parameters<
        typeof x509.X509CertificateGenerator.createSelfSigned
      >[1]
    )
    const nodeCert = new X509Certificate(Buffer.from(peculiarCert.rawData))
    expect(validateCertShouldLoad(nodeCert)).toBe(nodeCert)
  })
  it('should not install a cert that is no longer valid', async () => {
    const peculiarCert = await x509.X509CertificateGenerator.createSelfSigned(
      {
        keys,
        serialNumber: '01',
        name: 'CN=Test',
        notBefore: new Date(Date.now() - 48 * 60 * 60 * 1000),
        notAfter: new Date(Date.now() - 24 * 60 * 60 * 1000),
        signingAlgorithm,
        extensions: [
          new x509.BasicConstraintsExtension(true, 2, true),
          new x509.ExtendedKeyUsageExtension([
            '1.2.3.4.5.6.7',
            '2.3.4.5.6.7.8',
          ]),
          new x509.KeyUsagesExtension(
            x509.KeyUsageFlags.keyCertSign | x509.KeyUsageFlags.cRLSign,
            true
          ),
          await x509.SubjectKeyIdentifierExtension.create(keys.publicKey),
        ],
      },
      webcrypto as Parameters<
        typeof x509.X509CertificateGenerator.createSelfSigned
      >[1]
    )
    const nodeCert = new X509Certificate(Buffer.from(peculiarCert.rawData))
    expect(validateCertShouldLoad(nodeCert)).toBeNull()
  })
  it('should verify with a cert that is currently valid', async () => {
    const peculiarCert = await x509.X509CertificateGenerator.createSelfSigned(
      {
        keys,
        serialNumber: '01',
        name: 'CN=Test',
        notBefore: new Date(Date.now() - 24 * 60 * 60 * 1000),
        notAfter: new Date(Date.now() + 24 * 60 * 60 * 1000),
        signingAlgorithm,
        extensions: [
          new x509.BasicConstraintsExtension(true, 2, true),
          new x509.ExtendedKeyUsageExtension([
            '1.2.3.4.5.6.7',
            '2.3.4.5.6.7.8',
          ]),
          new x509.KeyUsagesExtension(
            x509.KeyUsageFlags.keyCertSign | x509.KeyUsageFlags.cRLSign,
            true
          ),
          await x509.SubjectKeyIdentifierExtension.create(keys.publicKey),
        ],
      },
      webcrypto as Parameters<
        typeof x509.X509CertificateGenerator.createSelfSigned
      >[1]
    )
    const nodeCert = new X509Certificate(Buffer.from(peculiarCert.rawData))
    expect(validateCertShouldVerify(nodeCert)).toBe(nodeCert)
  })
  it('should not verify with a cert that is not yet valid', async () => {
    const peculiarCert = await x509.X509CertificateGenerator.createSelfSigned(
      {
        keys,
        serialNumber: '01',
        name: 'CN=Test',
        notBefore: new Date(Date.now() + 24 * 60 * 60 * 1000),
        notAfter: new Date(Date.now() + 48 * 60 * 60 * 1000),
        signingAlgorithm,
        extensions: [
          new x509.BasicConstraintsExtension(true, 2, true),
          new x509.ExtendedKeyUsageExtension([
            '1.2.3.4.5.6.7',
            '2.3.4.5.6.7.8',
          ]),
          new x509.KeyUsagesExtension(
            x509.KeyUsageFlags.keyCertSign | x509.KeyUsageFlags.cRLSign,
            true
          ),
          await x509.SubjectKeyIdentifierExtension.create(keys.publicKey),
        ],
      },
      webcrypto as Parameters<
        typeof x509.X509CertificateGenerator.createSelfSigned
      >[1]
    )
    const nodeCert = new X509Certificate(Buffer.from(peculiarCert.rawData))
    expect(validateCertShouldVerify(nodeCert)).toBeNull()
  })
  it('should not verify with a cert that is no longer valid', async () => {
    const peculiarCert = await x509.X509CertificateGenerator.createSelfSigned(
      {
        keys,
        serialNumber: '01',
        name: 'CN=Test',
        notBefore: new Date(Date.now() - 48 * 60 * 60 * 1000),
        notAfter: new Date(Date.now() - 24 * 60 * 60 * 1000),
        signingAlgorithm,
        extensions: [
          new x509.BasicConstraintsExtension(true, 2, true),
          new x509.ExtendedKeyUsageExtension([
            '1.2.3.4.5.6.7',
            '2.3.4.5.6.7.8',
          ]),
          new x509.KeyUsagesExtension(
            x509.KeyUsageFlags.keyCertSign | x509.KeyUsageFlags.cRLSign,
            true
          ),
          await x509.SubjectKeyIdentifierExtension.create(keys.publicKey),
        ],
      },
      webcrypto as Parameters<
        typeof x509.X509CertificateGenerator.createSelfSigned
      >[1]
    )
    const nodeCert = new X509Certificate(Buffer.from(peculiarCert.rawData))
    expect(validateCertShouldVerify(nodeCert)).toBeNull()
  })
})

describe('incoming cert checking', async () => {
  const ssProvider = webcrypto as Parameters<
    typeof x509.X509CertificateGenerator.createSelfSigned
  >[1]
  const provider = webcrypto as Parameters<
    typeof x509.X509CertificateGenerator.create
  >[1]
  const signingAlgorithm = {
    name: 'RSASSA-PKCS1-v1_5',
    hash: 'SHA-256',
    publicExponent: new Uint8Array([1, 0, 1]),
    modulusLength: 2048,
  }
  const caKeys = await crypto.subtle.generateKey(signingAlgorithm, false, [
    'sign',
    'verify',
  ])
  const peculiarCA = await x509.X509CertificateGenerator.createSelfSigned(
    {
      keys: caKeys,
      serialNumber: '01',
      name: 'CN=Test',
      notBefore: new Date(Date.now() - 24 * 60 * 60 * 1000),
      notAfter: new Date(Date.now() + 24 * 60 * 60 * 1000),
      signingAlgorithm,
      extensions: [
        new x509.BasicConstraintsExtension(true, 2, true),

        new x509.ExtendedKeyUsageExtension(['1.2.3.4.5.6.7', '2.3.4.5.6.7.8']),
        new x509.KeyUsagesExtension(
          x509.KeyUsageFlags.keyCertSign | x509.KeyUsageFlags.cRLSign,
          true
        ),
        await x509.SubjectKeyIdentifierExtension.create(caKeys.publicKey),
      ],
    },
    ssProvider
  )
  const nodeCA = new X509Certificate(Buffer.from(peculiarCA.rawData))
  const eeKeys = await crypto.subtle.generateKey(signingAlgorithm, false, [
    'sign',
    'verify',
  ])
  const peculiarEE = await x509.X509CertificateGenerator.create(
    {
      signingKey: caKeys.privateKey,
      publicKey: eeKeys.publicKey,
      issuer: peculiarCA.subject,
      notBefore: new Date(Date.now() - 60 * 60 * 1000),
      notAfter: new Date(Date.now() + 60 * 60 * 1000),
      extensions: [
        new x509.BasicConstraintsExtension(false, undefined, true),
        new x509.KeyUsagesExtension(
          x509.KeyUsageFlags.digitalSignature |
            x509.KeyUsageFlags.keyEncipherment |
            x509.KeyUsageFlags.cRLSign,
          true
        ),
        new x509.ExtendedKeyUsageExtension([
          '1.3.6.1.5.5.7.3.1',
          '1.3.6.1.5.5.7.3.2',
        ]),
        await x509.SubjectKeyIdentifierExtension.create(eeKeys.publicKey),
        await x509.AuthorityKeyIdentifierExtension.create(caKeys.publicKey),
      ],
    },
    provider
  )
  const nodeEE = new X509Certificate(Buffer.from(peculiarEE.rawData))
  const otherCAKey = await crypto.subtle.generateKey(signingAlgorithm, false, [
    'sign',
    'verify',
  ])
  const otherPeculiarCA = await x509.X509CertificateGenerator.createSelfSigned(
    {
      keys: otherCAKey,
      serialNumber: '01',
      name: 'CN=Test',
      notBefore: new Date(Date.now() - 24 * 60 * 60 * 1000),
      notAfter: new Date(Date.now() + 24 * 60 * 60 * 1000),
      signingAlgorithm,
      extensions: [
        new x509.BasicConstraintsExtension(true, 2, true),

        new x509.ExtendedKeyUsageExtension(['1.2.3.4.5.6.7', '2.3.4.5.6.7.8']),
        new x509.KeyUsagesExtension(
          x509.KeyUsageFlags.keyCertSign | x509.KeyUsageFlags.cRLSign,
          true
        ),
        await x509.SubjectKeyIdentifierExtension.create(otherCAKey.publicKey),
      ],
    },
    ssProvider
  )
  const otherNodeCA = new X509Certificate(Buffer.from(otherPeculiarCA.rawData))
  it('should verify an EE certificate created by at least one CA', async () => {
    expect(validateCert(nodeEE, [nodeCA, otherNodeCA])).toBe(true)
  })
  it('should reject an EE certificate not created by any CA', async () => {
    expect(validateCert(nodeEE, [otherNodeCA])).toBe(false)
  })
})
