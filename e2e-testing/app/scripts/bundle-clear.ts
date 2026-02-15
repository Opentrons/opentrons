#!/usr/bin/env npx tsx
/**
 * Clear all protocol bundle test results (pass.json and fail.json).
 *
 * Usage:
 *   npx tsx scripts/bundle-clear.ts
 */

import { existsSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'

const RESULTS_DIR = resolve(
  import.meta.dirname ?? '.',
  '..',
  'test-results',
  'protocol-bundle',
)

const files = ['pass.json', 'fail.json']

let cleared = 0
for (const file of files) {
  const filePath = resolve(RESULTS_DIR, file)
  if (existsSync(filePath)) {
    rmSync(filePath)
    console.log(`  Deleted ${file}`)
    cleared++
  } else {
    console.log(`  ${file} — not found (already clean)`)
  }
}

console.log(cleared > 0 ? '\n✓ Results cleared.' : '\n✓ Nothing to clear.')
