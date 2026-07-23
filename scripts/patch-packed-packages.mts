/**
 * Patches extracted js-package-testing/pack/ directories so their package.json
 * files match what npm consumers receive after scripts/publish.mts runs.
 *
 * `pnpm pack` (via each library Makefile) already rewrote catalog: / workspace:*.
 * This script applies the remaining debt patches from package-json-patches.mts
 * (files / exports / @types moves / peer ranges).
 *
 * Run from repo root (or via js-package-testing Makefile):
 *   node --experimental-strip-types scripts/patch-packed-packages.mts
 */

import { readFileSync, writeFileSync } from 'node:fs'
import * as path from 'node:path'

import { patchPackageJsonByName } from './package-json-patches.mts'

const PACK_VERSION = '0.0.0-dev'
const MONO_ROOT = path.resolve(import.meta.dirname, '..')
const JS_PACKAGE_TESTING_ROOT = path.join(MONO_ROOT, 'js-package-testing')

const PACK_DIRS = [
  'pack/opentrons-shared-data',
  'pack/opentrons-step-generation',
  'pack/opentrons-components',
  'pack/opentrons-protocol-visualization',
] as const

function readJson(filePath: string): Record<string, unknown> {
  return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>
}

function writeJson(filePath: string, data: unknown): void {
  writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8')
}

function main(): void {
  for (const packDir of PACK_DIRS) {
    const packageJsonPath = path.join(
      JS_PACKAGE_TESTING_ROOT,
      packDir,
      'package.json'
    )
    const pkg = readJson(packageJsonPath)
    const patched = patchPackageJsonByName(pkg, PACK_VERSION)

    writeJson(packageJsonPath, patched)
    console.log(`Patched js-package-testing/${packDir}/package.json`)
  }
}

main()
