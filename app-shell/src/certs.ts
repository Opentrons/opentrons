import { pbkdf2, subtle, X509Certificate } from 'crypto'
import { promisify } from 'util'
import { app, ipcMain } from 'electron'

import { createLogger } from './log'

import type { IpcMainInvokeEvent } from 'electron'

const promisifiedPBKDF = promisify(pbkdf2)

const knownCertificates = new Map<string, X509Certificate>()

// certificates encrypted more than 1 minute ago and less than 10 years ago (so that things don't break
// if the robot's time isn't synced) will fail. also if it's from the future by too much something odd is
// going on and it's better to avoid things
const CERT_DECRYPTION_TTL_RECENT_S = 60
const CERT_DECRYPTION_TTL_NOT_RECENT_S = 10 * 365 * 24 * 60 * 60
const CERT_DECRYPTION_FORWARD_CLOCK_SKEW_NEAR_S = 24 * 60 * 60
const CERT_DECRYPTION_FORWARD_CLOCK_SKEW_FAR_S = 10 * 365 * 24 * 60 * 60

function addCertificateToMap(certificate: X509Certificate): void {
  const sha256Fingerprint = certificate.fingerprint256
  knownCertificates.set(sha256Fingerprint, certificate)
  log.silly(`added certificate at ${sha256Fingerprint}`)
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
  const version = decodedToken.subarray(0, 1)
  const time = decodedToken.subarray(1, 9)
  const iv = decodedToken.subarray(9, 25)
  const ciphertext = decodedToken.subarray(25, -32)
  const hmac = decodedToken.subarray(-32)
  if (version[0] !== 128) {
    throw new Error('Bad encryption version')
  }
  const timeVal = time.readBigInt64BE()
  if (timeVal > Number.MAX_SAFE_INTEGER / 1000) {
    throw new Error('Time too far in the future')
  }
  const tokenTime = new Date(Number(timeVal) * 1000).valueOf()
  const now = Date.now()
  const timeDiff = (now - tokenTime) / 1000
  if (
    timeDiff > CERT_DECRYPTION_TTL_RECENT_S &&
    timeDiff < CERT_DECRYPTION_TTL_NOT_RECENT_S
  ) {
    throw new Error('Encrypted certificate is too old')
  }
  if (
    timeDiff < -CERT_DECRYPTION_FORWARD_CLOCK_SKEW_NEAR_S &&
    timeDiff > -CERT_DECRYPTION_FORWARD_CLOCK_SKEW_FAR_S
  ) {
    throw new Error('Encrypted certificate is from the future')
  }
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
      const incomingAsBuffer = Buffer.from(certificate.data)
      const incomingAsNodeJSCert = new X509Certificate(incomingAsBuffer)
      for (const knownCert of knownCertificates.values()) {
        if (incomingAsNodeJSCert.checkIssued(knownCert)) {
          if (incomingAsNodeJSCert.verify(knownCert.publicKey)) {
            log.silly('good sign match for cert, allowing')
            event.preventDefault()
            allowRequest(true)
            return
          }
        }
      }
      log.info('no sign match for cert, denying')
    }
  )
}
