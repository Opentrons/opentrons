export type NumericalKeyboardKey =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '.'
  | '-'
  | 'del'

export interface NumericalInputOptions {
  allowDecimal?: boolean
  allowNegative?: boolean
}

const DIGIT_KEYS = new Set<NumericalKeyboardKey>([
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
])

export function toNumericalKeyboardKey(
  keyboardButton: string
): NumericalKeyboardKey | null {
  if (keyboardButton === '{backspace}') {
    return 'del'
  }
  if (isNumericalKeyboardKey(keyboardButton)) {
    return keyboardButton
  }
  return null
}

export function applyNumericalKeyboardKey(
  value: string,
  key: NumericalKeyboardKey,
  options: NumericalInputOptions = {}
): string {
  if (key === 'del') {
    return value.slice(0, value.length - 1)
  }
  if (key === '.' && options.allowDecimal === true && !value.includes('.')) {
    return `${value}${key}`
  }
  if (key === '-' && options.allowNegative === true && value.length === 0) {
    return key
  }
  if (DIGIT_KEYS.has(key)) {
    return `${value}${key}`
  }
  return value
}

export function isValidNumericalInput(
  value: string,
  options: NumericalInputOptions = {}
): boolean {
  if (options.allowDecimal === true && options.allowNegative === true) {
    return /^-?\d*\.?\d*$/.test(value)
  }
  if (options.allowDecimal === true) {
    return /^\d*\.?\d*$/.test(value)
  }
  if (options.allowNegative === true) {
    return /^-?\d*$/.test(value)
  }
  return /^\d*$/.test(value)
}

function isNumericalKeyboardKey(value: string): value is NumericalKeyboardKey {
  return (
    value === '0' ||
    value === '1' ||
    value === '2' ||
    value === '3' ||
    value === '4' ||
    value === '5' ||
    value === '6' ||
    value === '7' ||
    value === '8' ||
    value === '9' ||
    value === '.' ||
    value === '-'
  )
}
