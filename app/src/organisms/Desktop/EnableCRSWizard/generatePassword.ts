import times from 'lodash/times'

const CHARS_PER_SEGMENT = 3
const NUM_SEGMENTS = 4

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'
const LOOKALIKES_TO_EXCLUDE = 'o' + 'il' + 'rnm' + 'uv'

/** Generates a random password like "qps-ege-rnw". */
export function generatePassword(): string {
  const allowedCharset = [...ALPHABET].filter(
    char => !LOOKALIKES_TO_EXCLUDE.includes(char)
  )
  const genSegment = (): string =>
    times(CHARS_PER_SEGMENT, () => randomChoice(allowedCharset)).join('')
  const fullPassword = times(NUM_SEGMENTS, genSegment).join('-')
  return fullPassword
}

function randomChoice<T>(possibilities: T[]): T {
  const randomIndex = randomByteInRange(possibilities.length)
  return possibilities[randomIndex]
}

/** Returns a cryptographically random byte in the range [0..exclusiveMax). */
function randomByteInRange(exclusiveMax: number): number {
  if (exclusiveMax > 256) {
    throw new Error('exclusiveMax too high')
  }
  // Discard (do not scale) out-of-range values to avoid modulo or scaling bias.
  let byte: number
  do {
    byte = randomByte()
  } while (byte >= exclusiveMax)
  return byte
}

function randomByte(): number {
  const buffer = new Uint8Array(1)
  window.crypto.getRandomValues(buffer)
  return buffer[0]
}
