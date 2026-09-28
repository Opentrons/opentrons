/**
 * Generates auth-server/auth_server/users/software_keyboard_hanzi.py from the
 * same simple-keyboard-layouts Chinese candidates the ODD software keyboard uses.
 *
 * Run from app/:
 *   node src/atoms/SoftwareKeyboard/generateSoftwareKeyboardHanzi.mjs
 *
 * Rerun this script if fullKeyboardLayout or simple-keyboard-layouts changes,
 * then commit the regenerated software_keyboard_hanzi.py.
 */

import { writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// CJS build: the ESM layout file has no package "type": "module".
const require = createRequire(import.meta.url)
const chineseLayout =
  require('simple-keyboard-layouts/build/commonjs/layouts/chinese.js').default

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = join(
  SCRIPT_DIR,
  '../../../../auth-server/auth_server/users/software_keyboard_hanzi.py'
)

function flattenHanzi(layoutCandidates) {
  const hanzi = new Set()
  for (const value of Object.values(layoutCandidates ?? {})) {
    for (const character of String(value).split(' ')) {
      if (character.length > 0) {
        hanzi.add(character)
      }
    }
  }
  return [...hanzi].sort().join('')
}

const hanzi = flattenHanzi(chineseLayout.layoutCandidates)
const escaped = hanzi.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

const contents = `"""GENERATED FILE. Do not edit by hand.

Hanzi supported by the ODD software keyboard (simple-keyboard-layouts
Chinese pinyin candidates).

If the software keyboard or simple-keyboard-layouts changes, rerun from app/:
  node src/atoms/SoftwareKeyboard/generateSoftwareKeyboardHanzi.mjs
and commit this file.
"""

SOFTWARE_KEYBOARD_HANZI = "${escaped}"
`

writeFileSync(OUTPUT_PATH, contents, 'utf8')
console.log(`Wrote ${hanzi.length} hanzi to ${OUTPUT_PATH}`)
