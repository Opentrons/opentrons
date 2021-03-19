// @flow
// hash strings for an amount of anonymity
// note: values will be _hashed_, not _enctrypted_; hashed values should not be
// considered secure nor should they ever be released publicly
const ALGORITHM = 'SHA-256'

export function hash(source: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(source)

  // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
  return global.crypto.subtle
    .digest(ALGORITHM, data)
    .then((digest: ArrayBuffer) => arrayBufferToHex(digest))
}

// https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest#Converting_a_digest_to_a_hex_string
function arrayBufferToHex(source: ArrayBuffer): string {
  const bytes = new Uint8Array(source)

  return [...bytes].map(b => b.toString(16).padStart(2, '0')).join('')
}
