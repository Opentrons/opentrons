import type { NumericalInputOptions, NumericalKeyboardKey } from '../types'

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

export const applyNumericalKeyboardKey = (
  value: string,
  key: NumericalKeyboardKey,
  options: NumericalInputOptions = {}
): string => {
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
