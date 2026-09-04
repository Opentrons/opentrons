/**
 * If the ODD software keyboard (`fullKeyboardLayout` or simple-keyboard-layouts)
 * is updated, rerun from `app/`:
 *   node src/atoms/SoftwareKeyboard/generateSoftwareKeyboardHanzi.mjs
 * and commit `auth-server/auth_server/users/software_keyboard_hanzi.py`.
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, expect, it } from 'vitest'

import { fullKeyboardLayout, layoutCandidates } from '../constants'
import {
  extractLayoutTokens,
  hasOnlyAllowedLegalNameCharacters,
  hasOnlyAllowedPasswordCharacters,
  hasOnlyAllowedUsernameCharacters,
  isSoftwareKeyboardSupportedCharacter,
  SOFTWARE_KEYBOARD_HANZI,
  SOFTWARE_KEYBOARD_LAYOUT_CHARACTERS,
  SOFTWARE_KEYBOARD_SYMBOLS,
} from '../softwareKeyboardCharacters'

const GENERATED_HANZI_PATH = resolve(
  __dirname,
  '../../../../../auth-server/auth_server/users/software_keyboard_hanzi.py'
)
const PYTHON_CHARACTERS_PATH = resolve(
  __dirname,
  '../../../../../auth-server/auth_server/users/software_keyboard_characters.py'
)

function flattenLayoutCandidates(): string {
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

function readGeneratedHanzi(): string {
  const source = readFileSync(GENERATED_HANZI_PATH, 'utf8')
  const match = source.match(/SOFTWARE_KEYBOARD_HANZI = "([\s\S]*)"\s*$/)
  if (match == null) {
    throw new Error(`Could not parse ${GENERATED_HANZI_PATH}`)
  }
  return match[1] ?? ''
}

function readPythonSymbols(): string {
  const source = readFileSync(PYTHON_CHARACTERS_PATH, 'utf8')
  const match = source.match(/SOFTWARE_KEYBOARD_SYMBOLS = r"""([\s\S]*?)"""/)
  if (match == null) {
    throw new Error(`Could not parse ${PYTHON_CHARACTERS_PATH}`)
  }
  return match[1] ?? ''
}

describe('softwareKeyboardCharacters', () => {
  it('includes every Full Keyboard layout token and space', () => {
    const layoutTokens = extractLayoutTokens([
      ...fullKeyboardLayout.default,
      ...fullKeyboardLayout.shift,
      ...fullKeyboardLayout.symbols,
      ...fullKeyboardLayout.numbers,
    ])

    for (const token of layoutTokens) {
      expect(SOFTWARE_KEYBOARD_LAYOUT_CHARACTERS.has(token)).toBe(true)
      expect(isSoftwareKeyboardSupportedCharacter(token)).toBe(true)
    }
    expect(SOFTWARE_KEYBOARD_LAYOUT_CHARACTERS.has(' ')).toBe(true)
  })

  it('does not include characters that are not on the Full Keyboard', () => {
    for (const character of SOFTWARE_KEYBOARD_LAYOUT_CHARACTERS) {
      if (character === ' ') {
        continue
      }
      expect(layoutTokensInclude(character)).toBe(true)
    }
    expect(isSoftwareKeyboardSupportedCharacter('`')).toBe(false)
    expect(isSoftwareKeyboardSupportedCharacter('\n')).toBe(false)
    expect(isSoftwareKeyboardSupportedCharacter('\t')).toBe(false)
    expect(isSoftwareKeyboardSupportedCharacter('é')).toBe(false)
  })

  it('hanzi match layoutCandidates and the generated Python file', () => {
    const fromCandidates = flattenLayoutCandidates()
    expect(SOFTWARE_KEYBOARD_HANZI).toBe(fromCandidates)
    expect(SOFTWARE_KEYBOARD_HANZI).toBe(readGeneratedHanzi())
    expect(SOFTWARE_KEYBOARD_SYMBOLS).toBe(readPythonSymbols())
    expect(isSoftwareKeyboardSupportedCharacter('你')).toBe(true)
    expect(isSoftwareKeyboardSupportedCharacter('\u3400')).toBe(false)
  })

  it('applies field-specific space rules', () => {
    expect(hasOnlyAllowedUsernameCharacters('Ada_Lovelace-1')).toBe(true)
    expect(hasOnlyAllowedUsernameCharacters('Ada Lovelace')).toBe(false)
    expect(hasOnlyAllowedUsernameCharacters('张伟')).toBe(true)
    expect(hasOnlyAllowedPasswordCharacters('pass word')).toBe(true)
    expect(hasOnlyAllowedLegalNameCharacters('张 Wei')).toBe(true)
    expect(hasOnlyAllowedPasswordCharacters('José')).toBe(false)
    expect(SOFTWARE_KEYBOARD_SYMBOLS.includes('`')).toBe(false)
  })
})

function layoutTokensInclude(character: string): boolean {
  const tokens = extractLayoutTokens([
    ...fullKeyboardLayout.default,
    ...fullKeyboardLayout.shift,
    ...fullKeyboardLayout.symbols,
    ...fullKeyboardLayout.numbers,
  ])
  return tokens.includes(character)
}
