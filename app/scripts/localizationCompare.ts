/**
 * Compare i18n keys between EN (reference) and ZH trees.
 *
 * Default dirs:
 *   EN: ./src/assets/localization/en
 *   ZH: ./src/assets/localization/zh
 *
 * CLI:
 *   npx tsx scripts/compare-l10n.ts
 *   # or
 *   npx ts-node scripts/compare-l10n.ts
 *
 * Optional args:
 *   --en <path>  --zh <path>
 *
 * Behavior:
 * - Walks both directories, reading all *.json files (namespaces)
 * - Flattens nested objects into dotted keys
 * - Compares per "global" key = "<namespace>.<flattenedKey>"
 * - Prints:
 *     • Missing in zh
 *     • Extra in zh
 *     • Empty strings in en
 *     • Empty strings in zh
 * - Exits 1 if any of the above lists are non-empty
 */

import { promises as fs } from 'node:fs'
import * as path from 'node:path'
import process from 'node:process'

type Dict = Record<string, unknown>

interface CompareResult {
  missingInZh: string[]
  extraInZh: string[]
  emptyEn: string[]
  emptyZh: string[]
}

const DEFAULT_EN_DIR = path.resolve('src/assets/localization/en')
const DEFAULT_ZH_DIR = path.resolve('src/assets/localization/zh')

/** Parse CLI args for --en and --zh overrides */
const parseArgs = (): { enDir: string; zhDir: string } => {
  const args = process.argv.slice(2)
  let enDir = DEFAULT_EN_DIR
  let zhDir = DEFAULT_ZH_DIR

  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--en') {
      enDir = path.resolve(args[i + 1])
      i++
    } else if (a === '--zh') {
      zhDir = path.resolve(args[i + 1])
      i++
    }
  }
  return { enDir, zhDir }
}

/** Recursively collect all .json files under a dir */
const collectJsonFiles = async (dir: string): Promise<string[]> => {
  const out: string[] = []
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const e of entries) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) {
      out.push(...(await collectJsonFiles(p)))
    } else if (e.isFile() && e.name.toLowerCase().endsWith('.json')) {
      out.push(p)
    }
  }
  return out.sort()
}

/** Read and parse JSON. Returns {} if file missing (when allowedMissing=true). */
const readJson = async (file: string, allowMissing = false): Promise<Dict> => {
  try {
    const raw = await fs.readFile(file, 'utf8')
    return JSON.parse(raw) as Dict
  } catch (err: any) {
    if (allowMissing && err?.code === 'ENOENT') return {}
    throw new Error(`Failed reading ${file}: ${err?.message ?? String(err)}`)
  }
}

/** Flatten nested objects into dotted keys */
const flatten = (obj: Dict, prefix = ''): Record<string, unknown> => {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj ?? {})) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flatten(v as Dict, key))
    } else {
      out[key] = v
    }
  }
  return out
}

/** Build a global key map: "<namespace>.<flattenedKey>" -> value */
const buildGlobalMap = async (
  dir: string
): Promise<Record<string, unknown>> => {
  const files = await collectJsonFiles(dir)
  const map: Record<string, unknown> = {}

  for (const file of files) {
    // namespace = file name without extension (keep subdir part to avoid collisions)
    // e.g., ".../en/common.json" -> "common"
    // If you want subdirs in namespace, you can use relative path without extension:
    //   const rel = path.relative(dir, file).replace(/\.json$/i, '').replaceAll(path.sep, '/')
    const ns = path.basename(file, '.json')
    const json = await readJson(file)
    const flat = flatten(json)
    for (const [k, v] of Object.entries(flat)) {
      const gk = `${ns}.${k}`
      map[gk] = v
    }
  }
  return map
}

const compare = (
  enMap: Record<string, unknown>,
  zhMap: Record<string, unknown>
): CompareResult => {
  const enKeys = new Set(Object.keys(enMap))
  const zhKeys = new Set(Object.keys(zhMap))

  const missingInZh = enKeys.difference(zhKeys)
  const extraInZh = zhKeys.difference(enKeys)
  const emptyEn: string[] = []
  const emptyZh: string[] = []

  // Missing in zh + empty strings in en
  for (const k of enKeys) {
    if (!zhKeys.has(k)) missingInZh.push(k)
    const v = enMap[k]
    if (v === '') emptyEn.push(k)
  }

  // Extra in zh + empty strings in zh
  for (const k of zhKeys) {
    if (!enKeys.has(k)) extraInZh.push(k)
    const v = zhMap[k]
    if (v === '') emptyZh.push(k)
  }

  missingInZh.sort()
  extraInZh.sort()
  emptyEn.sort()
  emptyZh.sort()

  return { missingInZh, extraInZh, emptyEn, emptyZh }
}

/** Pretty print a section with count and items */
const printSection = (title: string, items: string[]) => {
  const count = items.length
  const header = `${title} (${count})`
  console.log('\n' + header)
  console.log(''.padEnd(header.length, '-'))
  if (count) {
    for (const k of items) console.log(k)
  } else {
    console.log('none')
  }
}

const main = async (): Promise<void> => {
  const { enDir, zhDir } = parseArgs()

  console.log(`EN dir: ${enDir}`)
  console.log(`ZH dir: ${zhDir}`)

  // Build global key spaces
  const [enMap, zhMap] = await Promise.all([
    buildGlobalMap(enDir),
    buildGlobalMap(zhDir),
  ])

  const { missingInZh, extraInZh, emptyEn, emptyZh } = compare(enMap, zhMap)

  printSection('Keys missing in zh (present in en only)', missingInZh)
  printSection('Keys extra in zh (not in en)', extraInZh)
  printSection('Empty strings in en', emptyEn)
  printSection('Empty strings in zh', emptyZh)

  const hasProblems =
    missingInZh.length || extraInZh.length || emptyEn.length || emptyZh.length
  process.exit(hasProblems ? 1 : 0)
}

main().catch(err => {
  console.error(err)
  process.exit(2)
})
