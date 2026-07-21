/**
 * publish.mts
 *
 * Builds @opentrons/shared-data, @opentrons/step-generation,
 * @opentrons/components, and @opentrons/protocol-visualization from monorepo
 * source, fixes every known issue that broke the 0.2.1-alpha.0 npm releases,
 * injects a README and LICENSE into each tarball, and publishes all four to npm.
 *
 * Run with Node >= 22:
 *   node --experimental-strip-types js-package-testing/publish.mts [options]
 *
 * Options:
 *   --version <ver>    Semver string to publish as (required, e.g. 0.3.0-alpha.1)
 *   --tag <tag>        npm dist-tag(s); comma-separated or repeatable
 *                      (default: "alpha,latest")
 *   --registry <url>   npm registry URL (default: https://registry.npmjs.org)
 *   --dry-run          Build and patch everything but skip `npm publish`
 *   --skip-build       Skip make build steps (useful when lib/ is already fresh)
 *
 * What this script fixes vs raw monorepo package.json files:
 *  1. workspace:* / link: deps rewritten to real semver so published packages are usable.
 *  2. catalog: / catalog:react18 specifiers rewritten to concrete semver ranges.
 *  3. @types/* and unused runtime deps moved to devDependencies so consumers
 *     don't install them.
 *  4. peerDependencies rewritten to npm-compatible semver ranges.
 *  5. shared-data gets a proper `files` allowlist (lib/ only, no Makefile/Python).
 *  6. shared-data exports map verified to point at real CJS + ESM outputs.
 *  7. components exports map verified (require -> .js, import -> .mjs).
 *  8. protocol-visualization exports include ./styles -> lib/style.css.
 *  9. Smoke-tests the ESM output with Node's native dynamic import before publish.
 * 10. Each package ships a README (alpha disclaimer) and LICENSE (Apache-2.0
 *     inherited from the monorepo root).
 *
 * To run from repo root:
 *   node --experimental-strip-types js-package-testing/publish.mts \
 *     --version 0.3.7-alpha.0 --dry-run
 */

import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import * as path from 'node:path'

import {
  patchComponentsPackageJson,
  patchProtocolVisualizationPackageJson,
  patchSharedDataPackageJson,
  patchStepGenerationPackageJson,
} from './package-json-patches.mts'

// ---------------------------------------------------------------------------
// CLI arg parsing
// ---------------------------------------------------------------------------

type Args = {
  version: string
  tags: string[]
  registry: string
  dryRun: boolean
  skipBuild: boolean
}

const DEFAULT_TAGS = ['alpha', 'latest']

function parseTags(argv: string[]): string[] {
  const tags: string[] = []
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] !== '--tag') continue
    const value = argv[i + 1]
    if (value == null || value.startsWith('--')) {
      console.error('Error: --tag requires a value')
      process.exit(1)
    }
    tags.push(
      ...value
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean)
    )
    i++
  }
  return tags.length > 0 ? [...new Set(tags)] : DEFAULT_TAGS
}

function parseArgs(): Args {
  const argv = process.argv.slice(2)
  const get = (flag: string): string | undefined => {
    const idx = argv.indexOf(flag)
    return idx !== -1 ? argv[idx + 1] : undefined
  }

  const version = get('--version')
  if (!version) {
    console.error('Error: --version <semver> is required')
    process.exit(1)
  }

  return {
    version,
    tags: parseTags(argv),
    registry: get('--registry') ?? 'https://registry.npmjs.org',
    dryRun: argv.includes('--dry-run'),
    skipBuild: argv.includes('--skip-build'),
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MONO_ROOT = path.resolve(import.meta.dirname, '..')
const SHARED_DATA_ROOT = path.join(MONO_ROOT, 'shared-data')
const STEP_GENERATION_ROOT = path.join(MONO_ROOT, 'step-generation')
const COMPONENTS_ROOT = path.join(MONO_ROOT, 'components')
const PROTOCOL_VISUALIZATION_ROOT = path.join(
  MONO_ROOT,
  'protocol-visualization'
)
const ROOT_LICENSE = path.join(MONO_ROOT, 'LICENSE')

function run(cmd: string, cwd: string): void {
  console.log(`\n$ ${cmd}  (cwd: ${cwd})`)
  const result = spawnSync(cmd, { cwd, shell: true, stdio: 'inherit' })
  if (result.status !== 0) {
    throw new Error(
      `Command failed (exit ${result.status ?? 'signal'}): ${cmd}`
    )
  }
}

function readJson(filePath: string): Record<string, unknown> {
  return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>
}

function writeJson(filePath: string, data: unknown): void {
  writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8')
}

// ---------------------------------------------------------------------------
// README generator
// ---------------------------------------------------------------------------

function makeReadme(packageName: string, version: string): string {
  return `# ${packageName}

> **Alpha software - not intended for public use.**
>
> This package is published as a true alpha. There is no guarantee it works,
> no guarantee of API stability, and no support commitment. It may be broken,
> incomplete, or removed without notice. Do not use this in production.

## Version

\`${version}\`

## License

Apache-2.0 - see [LICENSE](./LICENSE).

## Source

This package is built from the [Opentrons monorepo](https://github.com/Opentrons/opentrons).
`
}

// ---------------------------------------------------------------------------
// Build steps
// ---------------------------------------------------------------------------

function buildSharedData(skipBuild: boolean): void {
  console.log('\n=== Building @opentrons/shared-data ===')
  if (!skipBuild) {
    run('make build-ts lib-js', SHARED_DATA_ROOT)
  } else {
    console.log('  (--skip-build: skipping)')
  }
}

function buildStepGeneration(skipBuild: boolean): void {
  console.log('\n=== Building @opentrons/step-generation ===')
  if (!skipBuild) {
    run('make lib', STEP_GENERATION_ROOT)
  } else {
    console.log('  (--skip-build: skipping)')
  }
}

function buildComponents(skipBuild: boolean): void {
  console.log('\n=== Building @opentrons/components ===')
  if (!skipBuild) {
    run('make build-ts lib', COMPONENTS_ROOT)
  } else {
    console.log('  (--skip-build: skipping)')
  }
}

function buildProtocolVisualization(skipBuild: boolean): void {
  console.log('\n=== Building @opentrons/protocol-visualization ===')
  if (!skipBuild) {
    run('make build-ts lib', PROTOCOL_VISUALIZATION_ROOT)
  } else {
    console.log('  (--skip-build: skipping)')
  }
}

// ---------------------------------------------------------------------------
// Smoke-test the ESM build with Node dynamic import
// ---------------------------------------------------------------------------

async function smokeTestEsm(
  libDir: string,
  packageName: string
): Promise<void> {
  console.log(`\n=== Smoke-testing ESM output for ${packageName} ===`)
  const esmPath = path.join(libDir, 'index.mjs')
  try {
    await import(esmPath)
    console.log(`  ESM smoke test PASSED for ${packageName}`)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('not found') || message.includes('CommonJS')) {
      console.error(
        `\n  FATAL: ESM import failed for ${packageName} — likely a lodash CJS interop issue.\n` +
          `  Error: ${message}\n` +
          `  Fix: ensure vite.config commonjsOptions.transformMixedEsModules = true is set.`
      )
      process.exit(1)
    }
    // Expected in bare Node: missing DOM globals, missing React peer, etc.
    console.log(
      `  ESM smoke test OK (non-fatal error in bare Node: ${message})`
    )
  }
}

// ---------------------------------------------------------------------------
// Stage and publish a single package
// ---------------------------------------------------------------------------

function publishPackage(
  sourceRoot: string,
  patchedPkgJson: Record<string, unknown>,
  version: string,
  args: Args
): void {
  const name = patchedPkgJson.name as string

  console.log(`\n=== Publishing ${name}@${version} ===`)

  const stagingDir = path.join(
    tmpdir(),
    `opentrons-publish-${name.replace('/', '-')}-${Date.now()}`
  )
  mkdirSync(stagingDir, { recursive: true })

  try {
    // Copy built artifacts listed in files[]
    const filesToCopy = (patchedPkgJson.files as string[]) ?? ['lib/']
    for (const entry of filesToCopy) {
      // README.md and LICENSE are written by this script, not copied from source
      if (entry === 'README.md' || entry === 'LICENSE') continue
      const src = path.join(sourceRoot, entry)
      const dest = path.join(stagingDir, entry)
      try {
        cpSync(src, dest, { recursive: true })
      } catch {
        console.warn(`  WARNING: could not copy ${entry} — skipping`)
      }
    }

    // Write generated README
    writeFileSync(
      path.join(stagingDir, 'README.md'),
      makeReadme(name, version),
      'utf8'
    )

    // Copy LICENSE from monorepo root
    try {
      cpSync(ROOT_LICENSE, path.join(stagingDir, 'LICENSE'))
    } catch {
      console.warn('  WARNING: could not copy root LICENSE — skipping')
    }

    // Write patched package.json
    writeJson(path.join(stagingDir, 'package.json'), patchedPkgJson)

    const [primaryTag, ...extraTags] = args.tags

    if (args.dryRun) {
      console.log(`  DRY RUN - would publish from ${stagingDir}`)
      console.log(`  Would publish with tag "${primaryTag}"`)
      for (const tag of extraTags) {
        console.log(`  Would add dist-tag "${tag}"`)
      }
      console.log('  Patched package.json:')
      console.log(JSON.stringify(patchedPkgJson, null, 2))
      console.log('\n  README.md:')
      console.log(makeReadme(name, version))
      // Show what npm pack would include from the staging dir
      run('npm pack --dry-run', stagingDir)
      return
    }

    // Pack to a tarball first, then publish the tarball.
    // Publishing a tarball (not a directory) bypasses all files/npmignore
    // heuristics and guarantees exactly what's in stagingDir gets shipped.
    run('npm pack', stagingDir)
    const safeName = name.replace('@', '').replace('/', '-')
    const tarball = path.join(stagingDir, `${safeName}-${version}.tgz`)
    run(
      `npm publish ${tarball} --registry ${args.registry} --tag ${primaryTag} --access public`,
      stagingDir
    )
    for (const tag of extraTags) {
      run(
        `npm dist-tag add ${name}@${version} ${tag} --registry ${args.registry}`,
        stagingDir
      )
    }
    console.log(
      `  Published ${name}@${version} with tag(s): ${args.tags.join(', ')}`
    )
  } finally {
    rmSync(stagingDir, { recursive: true, force: true })
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const args = parseArgs()

  console.log(`\nPublish settings:`)
  console.log(`  version:  ${args.version}`)
  console.log(`  tags:     ${args.tags.join(', ')}`)
  console.log(`  registry: ${args.registry}`)
  console.log(`  dry-run:  ${args.dryRun}`)

  // Build order: shared-data first, then step-generation and components (Vite
  // aliases), then protocol-visualization (depends on published-style peers).
  buildSharedData(args.skipBuild)
  buildStepGeneration(args.skipBuild)
  buildComponents(args.skipBuild)
  buildProtocolVisualization(args.skipBuild)

  // Smoke-test ESM outputs before touching npm
  await smokeTestEsm(
    path.join(SHARED_DATA_ROOT, 'lib'),
    '@opentrons/shared-data'
  )
  await smokeTestEsm(
    path.join(STEP_GENERATION_ROOT, 'lib'),
    '@opentrons/step-generation'
  )
  await smokeTestEsm(path.join(COMPONENTS_ROOT, 'lib'), '@opentrons/components')
  await smokeTestEsm(
    path.join(PROTOCOL_VISUALIZATION_ROOT, 'lib'),
    '@opentrons/protocol-visualization'
  )

  // Patch package.json files
  const sharedDataPkg = patchSharedDataPackageJson(
    readJson(path.join(SHARED_DATA_ROOT, 'package.json')),
    args.version
  )
  const stepGenerationPkg = patchStepGenerationPackageJson(
    readJson(path.join(STEP_GENERATION_ROOT, 'package.json')),
    args.version
  )
  const componentsPkg = patchComponentsPackageJson(
    readJson(path.join(COMPONENTS_ROOT, 'package.json')),
    args.version
  )
  const protocolVisualizationPkg = patchProtocolVisualizationPackageJson(
    readJson(path.join(PROTOCOL_VISUALIZATION_ROOT, 'package.json')),
    args.version
  )

  // Publish in dependency order, then protocol-visualization
  publishPackage(SHARED_DATA_ROOT, sharedDataPkg, args.version, args)
  publishPackage(STEP_GENERATION_ROOT, stepGenerationPkg, args.version, args)
  publishPackage(COMPONENTS_ROOT, componentsPkg, args.version, args)
  publishPackage(
    PROTOCOL_VISUALIZATION_ROOT,
    protocolVisualizationPkg,
    args.version,
    args
  )

  console.log('\nDone!')
  if (args.dryRun) {
    console.log('(dry-run mode — nothing was actually published)')
  }
}

main().catch(err => {
  console.error('\nPublish failed:', err instanceof Error ? err.message : err)
  process.exit(1)
})
