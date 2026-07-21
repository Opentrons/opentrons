'use strict'

/**
 * Scans api-client for functions that issue POST, PUT, PATCH, or DELETE requests
 * and writes their export names to lib/mutating-api-client-exports.json.
 *
 * Run from the monorepo root or this package:
 *   node scripts/eslint-plugin-opentrons/generate-mutating-api-client-exports.js
 */

const fs = require('fs')
const path = require('path')

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
const API_CLIENT_SRC = path.resolve(__dirname, '../../api-client/src')
const OUT_FILE = path.resolve(__dirname, 'lib/mutating-api-client-exports.json')

function walkTsFiles(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === 'node_modules') {
        continue
      }
      walkTsFiles(full, acc)
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      acc.push(full)
    }
  }
  return acc
}

function getMutatingImportMethods(source) {
  const importMatch = source.match(
    /import\s*\{([^}]+)\}\s*from\s*['"][^'"]*request['"]/
  )
  if (importMatch == null) {
    return []
  }
  return importMatch[1]
    .split(',')
    .map(s => s.trim())
    .filter(name => MUTATING_METHODS.has(name))
}

function getExportedFunctionNames(source) {
  return [...source.matchAll(/export\s+function\s+(\w+)/g)].map(m => m[1])
}

function main() {
  const names = new Set()
  for (const file of walkTsFiles(API_CLIENT_SRC)) {
    const source = fs.readFileSync(file, 'utf8')
    if (getMutatingImportMethods(source).length === 0) {
      continue
    }
    for (const name of getExportedFunctionNames(source)) {
      names.add(name)
    }
  }

  const sorted = [...names].sort()
  const payload = {
    description:
      'Auto-generated. Do not edit by hand. Regenerate with generate-mutating-api-client-exports.js',
    methods: ['POST', 'PUT', 'PATCH', 'DELETE'],
    exports: sorted,
  }

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true })
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  console.log(
    `Wrote ${sorted.length} mutating api-client exports to ${path.relative(
      process.cwd(),
      OUT_FILE
    )}`
  )
}

main()
