/**
 * Characters supported by the ODD software keyboard (Full Keyboard keys plus
 * Chinese pinyin candidates).
 *
 * Keep in sync with `auth-server/auth_server/users/software_keyboard_characters.py`.
 * If `fullKeyboardLayout` or `simple-keyboard-layouts` changes, rerun from `app/`:
 *   node src/atoms/SoftwareKeyboard/generateSoftwareKeyboardHanzi.mjs
 * and commit `auth-server/auth_server/users/software_keyboard_hanzi.py`.
 */

import { fullKeyboardLayout, layoutCandidates } from './constants'

const CONTROL_TOKEN = /^\{.*\}$/

export function extractLayoutTokens(rows: string[]): string[] {
  const tokens: string[] = []
  for (const row of rows) {
    for (const token of row.split(' ')) {
      if (token.length > 0 && !CONTROL_TOKEN.test(token)) {
        tokens.push(token)
      }
    }
  }
  return tokens
}

function flattenHanzi(): string {
  const hanzi = new Set<string>()
  const candidates = layoutCandidates['zh-CN']
  if (candidates != null) {
    for (const value of Object.values(candidates)) {
      for (const character of value.split(' ')) {
        if (character.length > 0) {
          hanzi.add(character)
        }
      }
    }
  }
  return [...hanzi].sort().join('')
}

const layoutRows = [
  ...fullKeyboardLayout.default,
  ...fullKeyboardLayout.shift,
  ...fullKeyboardLayout.symbols,
  ...fullKeyboardLayout.numbers,
]

/** Layout keys plus space. Built once at module load. */
export const SOFTWARE_KEYBOARD_LAYOUT_CHARACTERS = new Set([
  ...extractLayoutTokens(layoutRows),
  ' ',
])

/** Sorted unique pinyin-candidate hanzi. One string to avoid a large Set. */
export const SOFTWARE_KEYBOARD_HANZI = flattenHanzi()

export const SOFTWARE_KEYBOARD_SYMBOLS = [
  ...SOFTWARE_KEYBOARD_LAYOUT_CHARACTERS,
]
  .filter(character => !/[A-Za-z0-9 ]/.test(character))
  .sort()
  .join('')

export function isSoftwareKeyboardSupportedCharacter(
  character: string
): boolean {
  return (
    SOFTWARE_KEYBOARD_LAYOUT_CHARACTERS.has(character) ||
    SOFTWARE_KEYBOARD_HANZI.includes(character)
  )
}

export function hasOnlySoftwareKeyboardCharacters(value: string): boolean {
  for (const character of value) {
    if (!isSoftwareKeyboardSupportedCharacter(character)) {
      return false
    }
  }
  return true
}

export function hasOnlyAllowedUsernameCharacters(value: string): boolean {
  for (const character of value) {
    if (character === ' ' || !isSoftwareKeyboardSupportedCharacter(character)) {
      return false
    }
  }
  return true
}

export function hasOnlyAllowedPasswordCharacters(value: string): boolean {
  return hasOnlySoftwareKeyboardCharacters(value)
}

export function hasOnlyAllowedLegalNameCharacters(value: string): boolean {
  return hasOnlySoftwareKeyboardCharacters(value)
}
