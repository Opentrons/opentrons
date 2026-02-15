/**
 * Helper to read and understand the protocol bundle directory structure.
 *
 * Each protocol lives in its own subdirectory and contains:
 *   - `<slug>_metadata.json` — protocol metadata (name, robot type, API level, etc.)
 *   - `<slug>.py`            — the Python protocol file
 *   - `custom_labware/`      — (optional) custom labware JSON definitions
 *
 * The bundle root may also contain a shared `custom_labware/` directory.
 *
 * Pass / fail tracking:
 *   After each protocol test, call {@link recordPass} or {@link recordFail}
 *   to persist the result. On subsequent runs, {@link loadResults} returns
 *   the set of already-passed slugs so they can be excluded from selection.
 */

import { existsSync } from 'node:fs'
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

/** Shape of the `*_metadata.json` file inside each protocol directory. */
export interface ProtocolMetadata {
  slug: string
  name: string
  is_active: boolean
  oem_name: string
  has_lp: boolean
  custom_labware_count: number
  robot_type: string
  robot_name: string
  api_level: string
  is_private: boolean
  verification_opentrons: boolean
  protocol_library_parameters: unknown[]
  error_with_params: boolean | null
}

/** Resolved information about a single protocol in the bundle. */
export interface ProtocolEntry {
  /** Directory name / slug identifier. */
  slug: string
  /** Absolute path to the protocol directory. */
  dir: string
  /** Absolute path to the `.py` protocol file. */
  pyFile: string
  /** Parsed metadata from the `*_metadata.json` file. */
  metadata: ProtocolMetadata
  /** Absolute paths to any custom labware JSON files (may be empty). */
  customLabware: string[]
}

/**
 * Scan a protocol bundle directory and return a {@link ProtocolEntry} for
 * every valid protocol found.
 *
 * Directories that don't contain a `*_metadata.json` file (e.g. the shared
 * `custom_labware/` folder at the bundle root) are silently skipped.
 */
export async function loadProtocolBundle(
  bundlePath: string,
): Promise<ProtocolEntry[]> {
  const absoluteBundlePath = resolve(bundlePath)
  const entries = await readdir(absoluteBundlePath)

  const protocols: ProtocolEntry[] = []

  for (const entry of entries) {
    const entryPath = join(absoluteBundlePath, entry)
    const entryStat = await stat(entryPath)
    if (!entryStat.isDirectory()) continue

    // Look for the metadata JSON file — `<slug>_metadata.json`
    const metadataFileName = `${entry}_metadata.json`
    const metadataPath = join(entryPath, metadataFileName)

    const metadataExists = await stat(metadataPath)
      .then(s => s.isFile())
      .catch(() => false)
    if (!metadataExists) continue

    // Look for the Python protocol file — `<slug>.py`
    const pyFileName = `${entry}.py`
    const pyFilePath = join(entryPath, pyFileName)

    const pyFileExists = await stat(pyFilePath)
      .then(s => s.isFile())
      .catch(() => false)
    if (!pyFileExists) continue

    // Read and parse metadata
    const metadataRaw = await readFile(metadataPath, 'utf-8')
    const metadata: ProtocolMetadata = JSON.parse(metadataRaw)

    // Collect custom labware files (if the directory exists)
    const customLabware: string[] = []
    const customLabwarePath = join(entryPath, 'custom_labware')
    const hasCustomLabware = await stat(customLabwarePath)
      .then(s => s.isDirectory())
      .catch(() => false)

    if (hasCustomLabware) {
      const labwareFiles = await readdir(customLabwarePath)
      for (const lf of labwareFiles) {
        if (lf.endsWith('.json')) {
          customLabware.push(join(customLabwarePath, lf))
        }
      }
    }

    protocols.push({
      slug: entry,
      dir: entryPath,
      pyFile: pyFilePath,
      metadata,
      customLabware,
    })
  }

  return protocols
}

/**
 * Pick `count` random entries from a protocol list.
 *
 * Uses a Fisher-Yates partial shuffle so the selection is unbiased.
 * Returns fewer than `count` if the list is smaller.
 */
export function pickRandom<T>(items: T[], count: number): T[] {
  const pool = [...items]
  const n = Math.min(count, pool.length)
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(Math.random() * (pool.length - i))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, n)
}

// ---------------------------------------------------------------------------
// Pass / fail result tracking
// ---------------------------------------------------------------------------

/** Shape of a single entry in pass.json or fail.json. */
export interface ResultEntry {
  slug: string
  name: string
  robotName?: string
  apiLevel?: string
  timestamp: string
  /** Only present in fail entries. */
  reason?: string
  /** Only present in fail entries. */
  failedAtStep?: number
  totalSteps?: number
}

/** Contents of pass.json / fail.json. */
interface ResultFile {
  entries: ResultEntry[]
}

const RESULTS_DIR_NAME = 'test-results'
const PASS_FILE = 'pass.json'
const FAIL_FILE = 'fail.json'

/** Resolve the directory where pass.json / fail.json live. */
function resultsDir(bundlePath: string): string {
  // Store results alongside the bundle so they persist across runs
  // but stay inside test-results/ which is git-ignored.
  return resolve(bundlePath, '..', RESULTS_DIR_NAME, 'protocol-bundle')
}

/** Read a result file, returning an empty list if it doesn't exist. */
async function readResultFile(filePath: string): Promise<ResultFile> {
  if (!existsSync(filePath)) {
    return { entries: [] }
  }
  const raw = await readFile(filePath, 'utf-8')
  return JSON.parse(raw) as ResultFile
}

/** Write a result file (pretty-printed). */
async function writeResultFile(
  filePath: string,
  data: ResultFile,
): Promise<void> {
  const dir = resolve(filePath, '..')
  await mkdir(dir, { recursive: true })
  await writeFile(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8')
}

/**
 * Load previously recorded results from the bundle's results directory.
 *
 * Returns the set of slugs that have already passed and the set that
 * have already failed.
 */
export async function loadResults(
  bundlePath: string,
): Promise<{ passed: Set<string>; failed: Set<string> }> {
  const dir = resultsDir(bundlePath)
  const passData = await readResultFile(join(dir, PASS_FILE))
  const failData = await readResultFile(join(dir, FAIL_FILE))
  return {
    passed: new Set(passData.entries.map(e => e.slug)),
    failed: new Set(failData.entries.map(e => e.slug)),
  }
}

/** Record a protocol as passed. */
export async function recordPass(
  bundlePath: string,
  protocol: ProtocolEntry,
  totalSteps?: number,
): Promise<void> {
  const dir = resultsDir(bundlePath)
  const filePath = join(dir, PASS_FILE)
  const data = await readResultFile(filePath)

  data.entries = data.entries.filter(e => e.slug !== protocol.slug)
  data.entries.push({
    slug: protocol.slug,
    name: protocol.metadata.name,
    robotName: protocol.metadata.robot_name,
    apiLevel: protocol.metadata.api_level,
    totalSteps,
    timestamp: new Date().toISOString(),
  })

  await writeResultFile(filePath, data)
  console.log(`  ✅ Recorded PASS for "${protocol.metadata.name}" (${protocol.slug})`)
}

/** Record a protocol as failed. */
export async function recordFail(
  bundlePath: string,
  protocol: ProtocolEntry,
  reason: string,
  failedAtStep?: number,
  totalSteps?: number,
): Promise<void> {
  const dir = resultsDir(bundlePath)
  const filePath = join(dir, FAIL_FILE)
  const data = await readResultFile(filePath)

  data.entries = data.entries.filter(e => e.slug !== protocol.slug)
  data.entries.push({
    slug: protocol.slug,
    name: protocol.metadata.name,
    robotName: protocol.metadata.robot_name,
    apiLevel: protocol.metadata.api_level,
    reason,
    failedAtStep,
    totalSteps,
    timestamp: new Date().toISOString(),
  })

  await writeResultFile(filePath, data)
  console.log(`  ❌ Recorded FAIL for "${protocol.metadata.name}" (${protocol.slug})`)
}
