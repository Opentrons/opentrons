import { pbkdf2, subtle, X509Certificate } from 'crypto'
import { mkdir, open, readdir, rm, stat } from 'fs/promises'
import { Agent as HttpsAgent } from 'https'
import { join } from 'path'
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

const CERT_SUBDIR = 'robot-certificates'

const log = createLogger('certs')

/**
 * Convert a Node.js certificate fingerprint into a safe filename.
 *
 * `X509Certificate.fingerprint256` is colon-separated hex, e.g. `AB:CD:...`.
 * Colons are illegal in Windows filenames and display oddly in macOS Finder,
 * so strip them and keep only the hex digits.
 *
 * Exported for tests.
 */
export function getCertificateFilename(certificate: X509Certificate): string {
  return `${certificate.fingerprint256.replaceAll(':', '')}.cer`
}

async function wrappedStat(
  path: string
): Promise<Awaited<ReturnType<typeof stat>> | null> {
  try {
    return await stat(path)
  } catch (_: any) {
    return null
  }
}

async function ensureDir(path: string): Promise<void> {
  const dirstat = await wrappedStat(path)
  if (dirstat == null) {
    log.info(`${path} does not exist, making directory`)
    await mkdir(path, { recursive: true })
  } else if (!dirstat.isDirectory()) {
    log.warn(`${path} exists as a non-directory, removing`)
    await rm(path)
    await mkdir(path, { recursive: true })
  }
}

async function getCertDir(): Promise<string> {
  const basePath = app.getPath('userData')
  const certDir = join(basePath, CERT_SUBDIR)
  await ensureDir(certDir)
  return certDir
}

async function writeFile(path: string, contents: Buffer): Promise<void> {
  const certFile = await open(path, 'w')
  try {
    await certFile.writeFile(contents)
  } finally {
    await certFile.close()
  }
}

async function saveCertificateToDisk(
  certificate: X509Certificate
): Promise<void> {
  const certDir = await getCertDir()
  const certPath = join(certDir, getCertificateFilename(certificate))
  await writeFile(certPath, certificate.raw)
  log.info(`Saved certificate to ${certPath}`)
  addCertificateToMap(certificate)
}

async function readFile(path: string): Promise<Buffer> {
  const handle = await open(path, 'r')
  try {
    return await handle.readFile()
  } finally {
    await handle.close()
  }
}

async function tryLoadCertificate(
  path: string
): Promise<X509Certificate | null> {
  const contents = await readFile(path)
  try {
    return new X509Certificate(contents)
  } catch (err: any) {
    log.warning(`Invalid certificate: ${err}`)
    return null
  }
}

export function validateCertShouldLoad(
  certificate: X509Certificate
): X509Certificate | null {
  const now = Date.now()
  if (certificate.validToDate.valueOf() < now) {
    log.info(`Certificate ${certificate.fingerprint256} invalid (expired)`)
    return null
  }
  return certificate
}

async function loadCertificatesFromDisk(): Promise<void> {
  const certDir = await getCertDir()
  log.info(`Reading robot certificates from ${certDir}`)
  const certs = await readdir(certDir, {
    withFileTypes: true,
    encoding: 'utf8',
  })

  for (const possibleCert of certs) {
    if (!possibleCert.isFile()) {
      continue
    }
    if (!possibleCert.name.endsWith('.cer')) {
      continue
    }
    const certPath = join(certDir, possibleCert.name)
    const loaded = await tryLoadCertificate(certPath)
    if (loaded == null) {
      log.info(`Removing invalid certificate (can't be loaded) at ${certPath}`)
      await rm(certPath)
      continue
    }
    const validated = validateCertShouldLoad(loaded)
    if (validated == null) {
      await rm(certPath)
      continue
    }
    addCertificateToMap(validated)
  }
}

function addCertificateToMap(certificate: X509Certificate): void {
  const sha256Fingerprint = certificate.fingerprint256
  knownCertificates.set(sha256Fingerprint, certificate)
  log.info(`added certificate at ${sha256Fingerprint}`)
}

/**
 * HTTPS agent for main-process requests to robots (e.g. update zip upload).
 *
 * Renderer/Chromium traffic is covered by the `certificate-error` handler below.
 * Node `fetch` in the shell does not use that path, so HTTPS uploads must
 * trust the same installed robot CAs explicitly. Hostname verification is
 * skipped because robots are often addressed by IP while certs use a name.
 */
export function createRobotHttpsAgent(): HttpsAgent {
  const ca = Array.from(knownCertificates.values()).map(cert => cert.toString())

  return new HttpsAgent({
    ca,
    rejectUnauthorized: true,
    checkServerIdentity: () => undefined,
  })
}

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
  try {
    return await doDecrypt(password, saltBase64, kdfIterations, token)
  } catch (err: any) {
    log.info(`Failed to decrypt: ${err?.message ?? JSON.stringify(err)} `)
    throw new Error('Incorrect password')
  }
}

async function doDecrypt(
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
    throw new Error('Verification failed')
  }
  // where we differ from the example above - this is not an encoded UTF-8 string but an encoded
  // byte sequence
  return Buffer.from(decryptedData)
}

async function encryptedCertInstallListener(
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
  log.silly(
    `got encrypted cert, ca: ${certificate.ca} signer: ${certificate.issuer} notAfter: ${certificate.validToDate}`
  )
  await saveCertificateToDisk(certificate)
  return true
}

async function plaintextCertInstallListener(
  _event: IpcMainInvokeEvent,
  data: { certificateData: string }
): Promise<boolean> {
  const certDER = Buffer.from(data.certificateData, 'base64url')
  const certificate = new X509Certificate(certDER)
  log.silly(
    `got plaintext cert, ca: ${certificate.ca} signer: ${certificate.issuer} notAfter: ${certificate.validToDate}`
  )
  await saveCertificateToDisk(certificate)
  return true
}

export function validateCertShouldVerify(
  certificate: X509Certificate
): X509Certificate | null {
  const now = Date.now()
  if (certificate.validToDate.valueOf() < now) {
    log.silly(
      `Certificate ${certificate.fingerprint256} invalid for verification (expired)`
    )
    return null
  }
  if (certificate.validFromDate.valueOf() > now) {
    log.silly(
      `Certificate ${certificate.fingerprint256} invalid for verification (not yet valid)`
    )
    return null
  }
  return certificate
}

export function validateCert(
  incomingCert: X509Certificate,
  certsToVerifyAgainst: { values: () => IterableIterator<X509Certificate> }
): boolean {
  const now = Date.now()
  const validatedIncoming = validateCertShouldVerify(incomingCert)
  if (validatedIncoming == null) {
    log.warning('Invalid certificate from request, denying')
    return false
  }
  for (const knownCert of certsToVerifyAgainst.values()) {
    if (knownCert.validFromDate.valueOf() > now) {
      log.silly(`Ignoring cert ${knownCert.fingerprint256}, not yet valid`)
      continue
    }
    const validated = validateCertShouldVerify(knownCert)
    if (validated == null) {
      continue
    }
    if (incomingCert.checkIssued(knownCert)) {
      if (incomingCert.verify(knownCert.publicKey)) {
        log.silly('good sign match for cert, allowing')
        return true
      }
    }
  }
  log.info('no sign match for cert, denying')
  return false
}

export async function registerCertIPC(): Promise<void> {
  ipcMain.handle('robot-cert:install-encrypted', encryptedCertInstallListener)
  ipcMain.handle('robot-cert:install-plaintext', plaintextCertInstallListener)
  app.on(
    'certificate-error',
    (event, _webContents, _url, _error, certificate, allowRequest) => {
      const incomingAsBuffer = Buffer.from(certificate.data)
      const incomingAsNodeJSCert = new X509Certificate(incomingAsBuffer)
      if (validateCert(incomingAsNodeJSCert, knownCertificates)) {
        allowRequest(true)
        event.preventDefault()
      }
    }
  )
  await loadCertificatesFromDisk()
}
