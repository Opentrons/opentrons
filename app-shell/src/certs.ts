import { pbkdf2, subtle, X509Certificate } from 'crypto'
import { promisify } from 'util'
import { app, ipcMain } from 'electron'

import { createLogger } from './log'

import type { IpcMainInvokeEvent } from 'electron'
import type { Action, Dispatch } from './types'

const promisifiedPBKDF = promisify(pbkdf2)

const knownCertificates = new Map<string, X509Certificate>()

function encodeFingerprint(
  fingerprint: string,
  algorithm: 'sha1' | 'sha256' | 'sha512'
): string {
  const fingerprintBuffer = Buffer.from(fingerprint.replaceAll(':', ''), 'hex')
  const encoded = `${algorithm}/${fingerprintBuffer.toString('base64')}`
  log.silly(
    `${algorithm} fingerprint encoding: original string ${fingerprint} bytes ${fingerprintBuffer.toString('hex')} encoded ${encoded}`
  )
  return encoded
}

function certificateFingerprintForAlgorithm(
  certificate: X509Certificate,
  algorithm: 'sha1' | 'sha256' | 'sha512'
): string {
  if (algorithm === 'sha1') {
    return certificate.fingerprint
  }
  if (algorithm === 'sha256') {
    return certificate.fingerprint256
  }
  if (algorithm === 'sha512') {
    return certificate.fingerprint512
  }
  throw new Error(`unhandled fingerprint algoritm ${algorithm}`)
}

function certificateFingerprintEncoded(
  certificate: X509Certificate,
  algorithm: 'sha1' | 'sha256' | 'sha512'
): string {
  const fingerprint = certificateFingerprintForAlgorithm(certificate, algorithm)
  return encodeFingerprint(fingerprint, algorithm)
}

function addCertificateToMap(certificate: X509Certificate): void {
  const sha1Fingerprint = certificateFingerprintEncoded(certificate, 'sha1')
  knownCertificates.set(sha1Fingerprint, certificate)
  log.silly(`added certificate at ${sha1Fingerprint}`)
  const sha256Fingerprint = certificateFingerprintEncoded(certificate, 'sha256')
  knownCertificates.set(sha256Fingerprint, certificate)
  log.silly(`added certificate at ${sha256Fingerprint}`)
  const sha512Fingerprint = certificateFingerprintEncoded(certificate, 'sha512')
  knownCertificates.set(sha512Fingerprint, certificate)
  log.silly(`added certificate at ${sha512Fingerprint}`)
}

const log = createLogger('certs')
/**
 * An implementation of the Fernet cryptosystem (https://github.com/fernet/spec)
 * decode side only tuned to our requirements.
 *
 * Based on https://github.com/richmiles/fernet-web for its use of modern web crypto APIs
 * with modifications to support binary data decode.
 *
 * this is exported for test purposes only; it shouldn't be used outside this file.
 */
export async function decryptFromOTDetails(
  password: string,
  saltBase64: string,
  kdfIterations: number,
  token: string
): Promise<Buffer> {
  log.info(
    `decrypting with password ${password} salt ${saltBase64} kdf iterations ${kdfIterations} token ${token}`
  )
  // first we turn the password into the key
  const salt = Buffer.from(saltBase64, 'base64url')
  const key = await promisifiedPBKDF(
    password,
    salt,
    kdfIterations,
    32,
    'sha256'
  )
  // a fernet key is actually two keys, one for crypt and one for sign. both need to
  // be loaded into WebCrypto facilities (crypto.subtle is a reexport of webcrypto.subtle)
  const signingKeyBuffer = key.subarray(0, 16)
  const encryptionKeyBuffer = key.subarray(16)

  const signingKey = await subtle.importKey(
    'raw',
    signingKeyBuffer,
    {
      name: 'HMAC',
      hash: 'SHA-256',
    },
    false,
    ['verify', 'sign']
  )

  const encryptionKey = await subtle.importKey(
    'raw',
    encryptionKeyBuffer,
    'AES-CBC',
    false,
    ['encrypt', 'decrypt']
  )

  // the token is a binary packed struct base64 encoded, so decode and unpack the parts
  // we need
  const decodedToken = Buffer.from(token, 'base64url')
  const iv = decodedToken.subarray(9, 25)
  const ciphertext = decodedToken.subarray(25, -32)
  const hmac = decodedToken.subarray(-32)
  // we can decrypt the message with the crypt key
  const decryptedData = await subtle.decrypt(
    {
      name: 'AES-CBC',
      iv: iv,
    },
    encryptionKey,
    ciphertext
  )
  // and verify the token with the verification key (the HMAC part of the token needs to be
  // stripped out first, though)
  const unsigned_token = decodedToken.subarray(0, -32)
  const verification = await subtle.verify(
    { name: 'HMAC', hash: 'SHA-256' },
    signingKey,
    hmac,
    unsigned_token
  )
  if (!verification) {
    throw new Error('Invalid or tampered with internal data!')
  }
  // where we differ from the example above - this is not an encoded UTF-8 string but an encoded
  // byte sequence
  return Buffer.from(decryptedData)
}

async function certInstallListener(
  _event: IpcMainInvokeEvent,
  data: {
    certificateData: string
    password: string
    salt: string
    iterations: number
  }
): Promise<boolean> {
  const certDER = await decryptFromOTDetails(
    data.password,
    data.salt,
    data.iterations,
    data.certificateData
  )
  const certificate = new X509Certificate(certDER)
  log.silly(`got cert, ca: ${certificate.ca} signer: ${certificate.issuer}`)
  addCertificateToMap(certificate)
  log.info(`added cert to known certificates, have ${knownCertificates.size}`)
  return true
}

export function registerCertIPC(): void {
  ipcMain.handle('robot-cert:install', certInstallListener)
  app.on(
    'certificate-error',
    (event, _webContents, _url, _error, certificate, allowRequest) => {
      const incomingFingerprintEncoded = certificate.issuerCert?.fingerprint
      if (incomingFingerprintEncoded == null) {
        log.warn('unsigned or self signed EE cert from robot, denying')
        allowRequest(false)
        return
      }

      if (knownCertificates.has(incomingFingerprintEncoded)) {
        log.silly(`good fingerprint match for ${incomingFingerprintEncoded}`)
        event.preventDefault()
        allowRequest(true)
      } else {
        log.info(
          `no fingerprint match for ${incomingFingerprintEncoded}, need certificate, denying`
        )
        allowRequest(false)
      }
    }
  )
}

export function registerCertHandlers(
  dispatch: Dispatch
): (action: Action) => unknown {
  return function handleIncomingAction(action: Action): void {}
}
