#!/usr/bin/env npx tsx
/**
 * Print a summary of protocol bundle test results (pass.json / fail.json).
 *
 * Usage:
 *   npx tsx scripts/bundle-results.ts
 *   npx tsx scripts/bundle-results.ts --failures   # only failures
 *   npx tsx scripts/bundle-results.ts --passes     # only passes
 */

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

interface ResultEntry {
  slug: string
  name: string
  robotName?: string
  apiLevel?: string
  timestamp: string
  reason?: string
  failedAtStep?: number
  totalSteps?: number
}

interface ResultFile {
  entries: ResultEntry[]
}

const RESULTS_DIR = resolve(
  import.meta.dirname ?? '.',
  '..',
  'test-results',
  'protocol-bundle',
)

function readJson(filename: string): ResultFile {
  const filePath = resolve(RESULTS_DIR, filename)
  if (!existsSync(filePath)) return { entries: [] }
  return JSON.parse(readFileSync(filePath, 'utf-8')) as ResultFile
}

function pad(s: string, len: number): string {
  return s.length >= len ? s : s + ' '.repeat(len - s.length)
}

const args = process.argv.slice(2)
const showFailures = args.length === 0 || args.includes('--failures')
const showPasses = args.length === 0 || args.includes('--passes')

const passes = readJson('pass.json')
const failures = readJson('fail.json')

const sep = '─'.repeat(80)

// ---- Failures ----
if (showFailures) {
  console.log(`\n${sep}`)
  console.log(`  FAILURES  (${failures.entries.length})`)
  console.log(sep)

  if (failures.entries.length === 0) {
    console.log('  No failures recorded.\n')
  } else {
    for (const e of failures.entries) {
      const step =
        e.failedAtStep != null
          ? `step ${e.failedAtStep}/${e.totalSteps ?? '?'}`
          : 'setup'
      const robot = e.robotName ?? '?'
      const api = e.apiLevel ?? '?'
      console.log('')
      console.log(`  ${pad(e.slug, 50)}  ${robot}  API ${api}`)
      console.log(`    Name:    ${e.name}`)
      console.log(`    Failed:  ${step}`)
      console.log(`    Reason:  ${e.reason}`)
      console.log(`    Time:    ${e.timestamp}`)
    }
    console.log('')
  }
}

// ---- Passes ----
if (showPasses) {
  console.log(`${sep}`)
  console.log(`  PASSES  (${passes.entries.length})`)
  console.log(sep)

  if (passes.entries.length === 0) {
    console.log('  No passes recorded.\n')
  } else {
    for (const e of passes.entries) {
      const steps = e.totalSteps != null ? `${e.totalSteps} steps` : ''
      const robot = e.robotName ?? '?'
      const api = e.apiLevel ?? '?'
      console.log(
        `  ${pad(e.slug, 50)}  ${robot}  API ${pad(api, 5)}  ${steps}`,
      )
    }
    console.log('')
  }
}

// ---- Summary ----
console.log(sep)
console.log(
  `  Total: ${passes.entries.length} passed, ${failures.entries.length} failed, ` +
    `${passes.entries.length + failures.entries.length} tested`,
)
console.log(sep)
