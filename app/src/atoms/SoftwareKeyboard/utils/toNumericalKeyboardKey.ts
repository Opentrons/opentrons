import type { NumericalKeyboardKey } from '../types'

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

export const toNumericalKeyboardKey = (
  keyboardButton: string
): NumericalKeyboardKey | null => {
  if (keyboardButton === '{backspace}') {
    return 'del'
  }
  if (isNumericalKeyboardKey(keyboardButton)) {
    return keyboardButton
  }
  return null
}
