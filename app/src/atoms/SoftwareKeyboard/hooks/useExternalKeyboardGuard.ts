import { useState } from 'react'

import {
  alphanumericKeyboardLayout,
  numericalKeyboardLayout,
} from '../constants'

type KeyboardType = 'alphanumeric' | 'numerical'

interface NumericalOptions {
  isDecimal?: boolean
  hasHyphen?: boolean
}

interface UseExternalKeyboardGuardResult {
  invalidChar: string | null
  validateInput: (newValue: string, prevValue: string) => boolean
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
  const layoutName = `${isDecimal ? 'float' : 'int'}${
    hasHyphen ? 'NegKeyboard' : 'Keyboard'
  }` as keyof typeof numericalKeyboardLayout
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

/**
 * detect the invalid char input from an external keyboard
 * invalid char: char isn't in software keyboard
 */
export const useExternalKeyboardGuard = (
  type: KeyboardType,
  options?: NumericalOptions
): UseExternalKeyboardGuardResult => {
  const [invalidChar, setInvalidChar] = useState<string | null>(null)

  const allowedChars = buildAllowedSet(type, options)

  const validateInput = (newValue: string, prevValue: string): boolean => {
    if (invalidChar !== null && newValue.length > prevValue.length) {
      return false
    }
    setInvalidChar(findFirstInvalidChar(newValue, allowedChars))
    return true
  }

  return { invalidChar, validateInput }
}
