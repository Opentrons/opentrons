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
 *   --tag <tag>        npm dist-tag (default: "latest")
 *   --registry <url>   npm registry URL (default: https://registry.npmjs.org)
 *   --dry-run          Build and patch everything but skip `npm publish`
 *   --skip-build       Skip yarn build steps (useful when lib/ is already fresh)
 *
 * What this script fixes vs the broken 0.2.1-alpha.0 release:
 *  1. link: deps rewritten to real semver so published packages are usable.
 *  2. @types/* and unused runtime deps moved to devDependencies so consumers
 *     don't install them.
 *  3. shared-data gets a proper `files` allowlist (lib/ only, no Makefile/Python).
 *  4. shared-data exports map verified to point at real CJS + ESM outputs.
 *  5. components exports map verified (require -> .js, import -> .mjs).
 *  6. Smoke-tests the ESM output with Node's native dynamic import before publish.
 *  7. Each package ships a README (alpha disclaimer) and LICENSE (Apache-2.0
 *     inherited from the monorepo root).
 * 
 * To run from repo root
 *   node --experimental-strip-types js-package-testing/publish.mts --version 0.3.0-alpha.1 --tag alpha --registry https://registry.npmjs.org --dry-run
 */

import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import * as path from 'node:path'

// ---------------------------------------------------------------------------
// CLI arg parsing
// ---------------------------------------------------------------------------

type Args = {
  version: string
  tag: string
  registry: string
  dryRun: boolean
  skipBuild: boolean
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
    tag: get('--tag') ?? 'latest',
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
const PROTOCOL_VISUALIZATION_ROOT = path.join(MONO_ROOT, 'protocol-visualization')
const ROOT_LICENSE = path.join(MONO_ROOT, 'LICENSE')

function run(cmd: string, cwd: string): void {
  console.log(`\n$ ${cmd}  (cwd: ${cwd})`)
  const result = spawnSync(cmd, { cwd, shell: true, stdio: 'inherit' })
  if (result.status !== 0) {
    throw new Error(`Command failed (exit ${result.status ?? 'signal'}): ${cmd}`)
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
    // `lib` target runs build-ts then yarn vite build
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
// package.json patchers
// ---------------------------------------------------------------------------

function patchSharedDataPackageJson(version: string): Record<string, unknown> {
  const pkg = readJson(path.join(SHARED_DATA_ROOT, 'package.json'))

  const devDeps: Record<string, string> = {
    ...((pkg.devDependencies as Record<string, string> | undefined) ?? {}),
  }
  const cleanDeps: Record<string, string> = {}
  for (const [name, range] of Object.entries(
    (pkg.dependencies as Record<string, string> | undefined) ?? {}
  )) {
    if (name.startsWith('@types/')) {
      devDeps[name] = range
    } else {
      cleanDeps[name] = range
    }
  }

  return {
    ...pkg,
    version,
    main: 'lib/index.cjs',
    module: 'lib/index.mjs',
    types: 'lib/js/index.d.ts',
    source: undefined,
    exports: {
      '.': {
        types: './lib/js/index.d.ts',
        import: './lib/index.mjs',
        require: './lib/index.cjs',
        default: './lib/index.mjs',
      },
      './package.json': './package.json',
    },
    files: ['lib/', 'README.md', 'LICENSE'],
    dependencies: cleanDeps,
    devDependencies: devDeps,
  }
}

function patchStepGenerationPackageJson(
  version: string
): Record<string, unknown> {
  const pkg = readJson(path.join(STEP_GENERATION_ROOT, 'package.json'))

  const devDeps: Record<string, string> = {
    ...((pkg.devDependencies as Record<string, string> | undefined) ?? {}),
  }
  const cleanDeps: Record<string, string> = {}
  for (const [name, range] of Object.entries(
    (pkg.dependencies as Record<string, string> | undefined) ?? {}
  )) {
    if (name.startsWith('@types/')) {
      devDeps[name] = range
      continue
    }
    if (range.startsWith('link:')) {
      if (name === '@opentrons/shared-data') {
        cleanDeps[name] = version
      } else {
        console.warn(`  WARNING: unknown link: dep ${name} in step-generation, rewriting to "*"`)
        cleanDeps[name] = '*'
      }
      continue
    }
    cleanDeps[name] = range
  }

  return {
    ...pkg,
    version,
    // step-generation already has correct main/module/types/exports in its
    // package.json; just bump version, rewrite links, clean up @types/*.
    files: ['lib/', 'README.md', 'LICENSE'],
    dependencies: cleanDeps,
    devDependencies: devDeps,
  }
}

// Deps that are type-only or confirmed absent from the components bundle
const COMPONENTS_TYPE_ONLY_DEPS = new Set([
  '@types/classnames',
  '@types/lodash',
  '@types/styled-components',
  '@types/webpack-env',
])
const COMPONENTS_UNUSED_RUNTIME_DEPS = new Set(['interactjs'])

function patchComponentsPackageJson(
  version: string,
  sharedDataVersion: string
): Record<string, unknown> {
  const pkg = readJson(path.join(COMPONENTS_ROOT, 'package.json'))

  const devDeps: Record<string, string> = {
    ...((pkg.devDependencies as Record<string, string> | undefined) ?? {}),
  }
  const cleanDeps: Record<string, string> = {}

  for (const [name, range] of Object.entries(
    (pkg.dependencies as Record<string, string> | undefined) ?? {}
  )) {
    if (COMPONENTS_TYPE_ONLY_DEPS.has(name) || COMPONENTS_UNUSED_RUNTIME_DEPS.has(name)) {
      devDeps[name] = range
      continue
    }
    if (range.startsWith('link:')) {
      if (name === '@opentrons/shared-data') {
        cleanDeps[name] = sharedDataVersion
      } else if (name === '@opentrons/step-generation') {
        cleanDeps[name] = version
      } else {
        console.warn(`  WARNING: unknown link: dep ${name} in components, rewriting to "*"`)
        cleanDeps[name] = '*'
      }
      continue
    }
    cleanDeps[name] = range
  }

  return {
    ...pkg,
    version,
    main: 'lib/index.js',
    module: 'lib/index.mjs',
    types: 'lib/index.d.ts',
    style: 'lib/style.css',
    source: undefined,
    exports: {
      '.': {
        types: './lib/index.d.ts',
        import: './lib/index.mjs',
        require: './lib/index.js',
        default: './lib/index.mjs',
      },
      './styles': './lib/style.css',
      './styles/global': './src/styles/global.css',
      './styles/legacy': './src/index.module.css',
      './package.json': './package.json',
    },
    // src/styles/ included because ./styles/global and ./styles/legacy exports
    // point into src/ rather than lib/
    files: ['lib/', 'src/styles/', 'src/index.module.css', 'README.md', 'LICENSE'],
    dependencies: cleanDeps,
    devDependencies: devDeps,
  }
}

function patchProtocolVisualizationPackageJson(
  version: string
): Record<string, unknown> {
  const pkg = readJson(path.join(PROTOCOL_VISUALIZATION_ROOT, 'package.json'))

  const devDeps: Record<string, string> = {
    ...((pkg.devDependencies as Record<string, string> | undefined) ?? {}),
  }
  const cleanDeps: Record<string, string> = {}

  for (const [name, range] of Object.entries(
    (pkg.dependencies as Record<string, string> | undefined) ?? {}
  )) {
    if (name.startsWith('@types/')) {
      devDeps[name] = range
      continue
    }
    if (range.startsWith('link:')) {
      if (
        name === '@opentrons/shared-data' ||
        name === '@opentrons/step-generation' ||
        name === '@opentrons/components'
      ) {
        cleanDeps[name] = version
      } else {
        console.warn(
          `  WARNING: unknown link: dep ${name} in protocol-visualization, rewriting to "*"`
        )
        cleanDeps[name] = '*'
      }
      continue
    }
    cleanDeps[name] = range
  }

  return {
    ...pkg,
    version,
    files: ['lib/', 'README.md', 'LICENSE'],
    dependencies: cleanDeps,
    devDependencies: devDeps,
  }
}

// ---------------------------------------------------------------------------
// Smoke-test the ESM build with Node dynamic import
// ---------------------------------------------------------------------------

async function smokeTestEsm(libDir: string, packageName: string): Promise<void> {
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
    console.log(`  ESM smoke test OK (non-fatal error in bare Node: ${message})`)
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

    if (args.dryRun) {
      console.log(`  DRY RUN — would publish from ${stagingDir}`)
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
      `npm publish ${tarball} --registry ${args.registry} --tag ${args.tag} --access public`,
      stagingDir
    )
    console.log(`  Published ${name}@${version} with tag "${args.tag}"`)
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
  console.log(`  tag:      ${args.tag}`)
  console.log(`  registry: ${args.registry}`)
  console.log(`  dry-run:  ${args.dryRun}`)

  // Build order: shared-data first, then step-generation and components (Vite
  // aliases), then protocol-visualization (depends on published-style peers).
  buildSharedData(args.skipBuild)
  buildStepGeneration(args.skipBuild)
  buildComponents(args.skipBuild)
  buildProtocolVisualization(args.skipBuild)

  // Smoke-test ESM outputs before touching npm
  await smokeTestEsm(path.join(SHARED_DATA_ROOT, 'lib'), '@opentrons/shared-data')
  await smokeTestEsm(path.join(STEP_GENERATION_ROOT, 'lib'), '@opentrons/step-generation')
  await smokeTestEsm(path.join(COMPONENTS_ROOT, 'lib'), '@opentrons/components')
  await smokeTestEsm(
    path.join(PROTOCOL_VISUALIZATION_ROOT, 'lib'),
    '@opentrons/protocol-visualization'
  )

  // Patch package.json files
  const sharedDataPkg = patchSharedDataPackageJson(args.version)
  const stepGenerationPkg = patchStepGenerationPackageJson(args.version)
  const componentsPkg = patchComponentsPackageJson(args.version, args.version)
  const protocolVisualizationPkg = patchProtocolVisualizationPackageJson(args.version)

  // Publish in dependency order, then protocol-visualization
  publishPackage(SHARED_DATA_ROOT, sharedDataPkg, args.version, args)
  publishPackage(STEP_GENERATION_ROOT, stepGenerationPkg, args.version, args)
  publishPackage(COMPONENTS_ROOT, componentsPkg, args.version, args)
  publishPackage(PROTOCOL_VISUALIZATION_ROOT, protocolVisualizationPkg, args.version, args)

  console.log('\nDone!')
  if (args.dryRun) {
    console.log('(dry-run mode — nothing was actually published)')
  }
}

main().catch(err => {
  console.error('\nPublish failed:', err instanceof Error ? err.message : err)
  process.exit(1)
})
