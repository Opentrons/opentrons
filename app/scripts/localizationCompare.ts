/**
 * Compare i18n keys between EN (reference) and ZH trees.
 *
 * Default dirs:
 *   EN: ./src/assets/localization/en
 *   ZH: ./src/assets/localization/zh
 *
 * CLI:
 *   npx tsx scripts/localizationCompare.ts
 *   # or
 *   npx ts-node scripts/localizationCompare.ts
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

// More specific types for i18n data
type I18nValue = string | number | boolean | null
interface I18nObject {
  [key: string]: I18nValue | I18nObject
}
type FlattenedI18nData = Record<string, I18nValue>
type GlobalKeyMap = Record<string, I18nValue>

interface CompareResult {
  readonly missingInZh: readonly string[]
  readonly extraInZh: readonly string[]
  readonly emptyEn: readonly string[]
  readonly emptyZh: readonly string[]
}

interface ParsedArgs {
  readonly enDir: string
  readonly zhDir: string
}

// Exit codes for better error handling
const EXIT_CODES = {
  SUCCESS: 0,
  VALIDATION_FAILED: 1,
  RUNTIME_ERROR: 2,
} as const

const DEFAULT_EN_DIR = path.resolve('src/assets/localization/en')
const DEFAULT_ZH_DIR = path.resolve('src/assets/localization/zh')

/** Parse CLI args for --en and --zh overrides */
const parseArgs = (): ParsedArgs => {
  const args = process.argv.slice(2)
  let enDir = DEFAULT_EN_DIR
  let zhDir = DEFAULT_ZH_DIR

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    const nextArg = args[i + 1]

    if (arg === '--en' && nextArg !== undefined && nextArg.length > 0) {
      enDir = path.resolve(nextArg)
      i++
    } else if (arg === '--zh' && nextArg !== undefined && nextArg.length > 0) {
      zhDir = path.resolve(nextArg)
      i++
    }
  }
  return { enDir, zhDir } as const
}

/**
 * Recursively collect all .json files under a directory.
 * @param dir - The directory to search
 * @returns Promise resolving to sorted array of file paths
 */
const collectJsonFiles = async (dir: string): Promise<string[]> => {
  const jsonFiles: string[] = []
  const entries = await fs.readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      jsonFiles.push(...(await collectJsonFiles(fullPath)))
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.json')) {
      jsonFiles.push(fullPath)
    }
  }
  return jsonFiles.sort()
}

/**
 * Read and parse JSON file with error handling.
 * @param file - Path to the JSON file
 * @param allowMissing - If true, returns empty object when file is missing
 * @returns Promise resolving to parsed JSON as I18nObject
 */
const readJson = async (
  file: string,
  allowMissing = false
): Promise<I18nObject> => {
  try {
    const raw = await fs.readFile(file, 'utf8')
    return JSON.parse(raw) as I18nObject
  } catch (err) {
    if (
      allowMissing &&
      err instanceof Error &&
      'code' in err &&
      err.code === 'ENOENT'
    ) {
      return {}
    }
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(`Failed reading ${file}: ${message}`)
  }
}

/**
 * Type guard to check if a value is an I18nObject.
 * @param value - Value to check
 * @returns True if value is an I18nObject
 */
const isI18nObject = (value: unknown): value is I18nObject => {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Flatten nested objects into dotted keys.
 * @param obj - The object to flatten
 * @param prefix - Key prefix for nested keys
 * @returns Flattened object with dotted keys
 */
const flatten = (obj: I18nObject, prefix = ''): FlattenedI18nData => {
  const result: FlattenedI18nData = {}

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix.length > 0 ? `${prefix}.${key}` : key
    if (isI18nObject(value)) {
      Object.assign(result, flatten(value, fullKey))
    } else {
      result[fullKey] = value as I18nValue
    }
  }
  return result
}

/**
 * Build a global key map from all JSON files in a directory.
 * @param dir - Directory containing JSON localization files
 * @returns Promise resolving to global key map
 */
const buildGlobalMap = async (dir: string): Promise<GlobalKeyMap> => {
  const files = await collectJsonFiles(dir)
  const globalMap: GlobalKeyMap = {}

  for (const file of files) {
    // Use filename (without extension) as namespace
    // e.g., ".../en/common.json" -> "common"
    const namespace = path.basename(file, '.json')
    const jsonContent = await readJson(file)
    const flattenedContent = flatten(jsonContent)

    for (const [key, value] of Object.entries(flattenedContent)) {
      const globalKey = `${namespace}.${key}`
      globalMap[globalKey] = value
    }
  }
  return globalMap
}

/**
 * Compare English and Chinese localization maps.
 * @param enMap - English localization key-value map
 * @param zhMap - Chinese localization key-value map
 * @returns Comparison result with differences and issues
 */
const compare = (enMap: GlobalKeyMap, zhMap: GlobalKeyMap): CompareResult => {
  const enKeys = new Set(Object.keys(enMap))
  const zhKeys = new Set(Object.keys(zhMap))

  // Use manual set difference since Set.difference might not be available
  const missingInZh: string[] = []
  const extraInZh: string[] = []
  const emptyEn: string[] = []
  const emptyZh: string[] = []

  // Find keys missing in zh and empty strings in en
  for (const key of enKeys) {
    if (!zhKeys.has(key)) {
      missingInZh.push(key)
    }
    const value = enMap[key]
    if (value === '') {
      emptyEn.push(key)
    }
  }

  // Find keys extra in zh and empty strings in zh
  for (const key of zhKeys) {
    if (!enKeys.has(key)) {
      extraInZh.push(key)
    }
    const value = zhMap[key]
    if (value === '') {
      emptyZh.push(key)
    }
  }

  // Sort all arrays for consistent output
  missingInZh.sort()
  extraInZh.sort()
  emptyEn.sort()
  emptyZh.sort()

  return { missingInZh, extraInZh, emptyEn, emptyZh }
}

/**
 * Pretty print a section with count and items.
 * @param title - Section title
 * @param items - Array of items to display
 */
const printSection = (title: string, items: readonly string[]): void => {
  const count = items.length
  const header = `${title} (${count})`
  console.log('\n' + header)
  console.log(''.padEnd(header.length, '-'))
  if (count > 0) {
    for (const item of items) {
      console.log(item)
    }
  } else {
    console.log('none')
  }
}

/**
 * Main execution function.
 */
const main = async (): Promise<void> => {
  const { enDir, zhDir } = parseArgs()

  console.log(`EN dir: ${enDir}`)
  console.log(`ZH dir: ${zhDir}`)

  // Build global key maps for both locales
  const [enMap, zhMap] = await Promise.all([
    buildGlobalMap(enDir),
    buildGlobalMap(zhDir),
  ])

  const { missingInZh, extraInZh, emptyEn, emptyZh } = compare(enMap, zhMap)

  printSection('Keys missing in zh (present in en only)', missingInZh)
  printSection('Keys extra in zh (not in en)', extraInZh)
  printSection('Empty strings in en', emptyEn)
  printSection('Empty strings in zh', emptyZh)

  // Exit with error code if any issues were found
  const hasProblems =
    missingInZh.length > 0 ||
    extraInZh.length > 0 ||
    emptyEn.length > 0 ||
    emptyZh.length > 0
  process.exit(hasProblems ? EXIT_CODES.VALIDATION_FAILED : EXIT_CODES.SUCCESS)
}

main().catch(err => {
  console.error(err)
  process.exit(EXIT_CODES.RUNTIME_ERROR)
})
