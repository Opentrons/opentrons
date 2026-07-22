/**
 * Patches extracted pack/ directories so their package.json files match what
 * npm consumers receive after publish.mts runs.
 *
 * Run from js-package-testing/ after build-local-packages:
 *   node --experimental-strip-types patch-packed-packages.mts
 */

import { readFileSync, writeFileSync } from 'node:fs'
import * as path from 'node:path'

import { patchPackageJsonByName } from '../scripts/package-json-patches.mts'

const PACK_VERSION = '0.0.0-dev'

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
  const root = import.meta.dirname

  for (const packDir of PACK_DIRS) {
    const packageJsonPath = path.join(root, packDir, 'package.json')
    const pkg = readJson(packageJsonPath)
    const patched = patchPackageJsonByName(pkg, PACK_VERSION)

    writeJson(packageJsonPath, patched)
    console.log(`Patched ${packDir}/package.json`)
  }
}

main()
