import {
  alphanumericKeyboardLayout,
  numericalKeyboardLayout,
} from '../constants'

export type KeyboardType = 'alphanumeric' | 'numerical'

export interface NumericalOptions {
  isDecimal?: boolean
  hasHyphen?: boolean
}

const extractAllowedChars = (rows: string[]): Set<string> => {
  const allowed = new Set<string>()
  for (const row of rows) {
    for (const token of row.split(' ')) {
      if (token.length > 0 && !/^\{.*\}$/.test(token)) {
        allowed.add(token)
      }
    }
  }
  return allowed
}

const buildAllowedSet = (
  type: KeyboardType,
  options?: NumericalOptions
): Set<string> => {
  if (type === 'alphanumeric') {
    return extractAllowedChars([
      ...alphanumericKeyboardLayout.default,
      ...alphanumericKeyboardLayout.shift,
      ...alphanumericKeyboardLayout.numbers,
    ])
  }
  const { isDecimal = false, hasHyphen = false } = options ?? {}
  const layoutName: keyof typeof numericalKeyboardLayout = (() => {
    if (isDecimal) {
      return hasHyphen ? 'floatNegKeyboard' : 'floatKeyboard'
    } else {
      return hasHyphen ? 'intNegKeyboard' : 'intKeyboard'
    }
  })()
  return extractAllowedChars(numericalKeyboardLayout[layoutName])
}

const findFirstInvalidChar = (
  value: string,
  allowedChars: Set<string>
): string | null => {
  for (const ch of value) {
    if (!allowedChars.has(ch)) return ch
  }
  return null
}

export const getInvalidCharForKeyboard = (
  value: string,
  type: KeyboardType,
  options?: NumericalOptions
): string | null => {
  return findFirstInvalidChar(value, buildAllowedSet(type, options))
}
