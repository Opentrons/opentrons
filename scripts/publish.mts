/**
 * publish.mts
 *
 * Builds @opentrons/shared-data, @opentrons/step-generation,
 * @opentrons/components, and @opentrons/protocol-visualization from monorepo
 * source, applies consumer-facing package.json patches, packs with `pnpm pack`
 * (so `catalog:` / `workspace:*` are rewritten by pnpm), injects a README and
 * LICENSE into each tarball, and publishes all four to npm via `npm publish`.
 *
 * Run with Node >= 22:
 *   node --experimental-strip-types scripts/publish.mts [options]
 *
 * Options:
 *   --version <ver>    Semver string to publish as (required, e.g. 0.3.9-alpha.0)
 *   --registry <url>   npm registry URL (default: https://registry.npmjs.org)
 *   --dry-run          Build and pack everything but skip `npm publish`
 *   --skip-build       Skip make build steps (useful when lib/ is already fresh)
 *
 * Always publishes with the "latest" dist-tag (not configurable).
 *
 * Auth (script itself is unchanged locally vs CI; only npm auth differs):
 *   - GitHub Actions: Trusted Publishing OIDC (no token; see workflow)
 *   - Local dry-run: no auth needed
 *   - Local real publish: interactive `npm login` + 2FA OTP (these packages
 *     disallow automation tokens). Prefer the CI workflow for releases.
 *
 * Why pnpm pack + npm publish (not pnpm publish):
 *   - `pnpm pack` owns `catalog:` / `workspace:*` rewriting (do not reimplement)
 *   - On pnpm 10.x, Trusted Publishing OIDC is reliable via `npm publish`
 *   - When the monorepo moves to pnpm 11+, switch the publish step to
 *     `pnpm publish` (native OIDC) and drop the npm publish call
 *
 * Debt patches (files / exports / @types / peer ranges) live in
 * ./package-json-patches.mts. Prefer fixing source package.jsons over time
 * and shrinking that module.
 *
 * Done here in publish.mts:
 *  1. Build + smoke-test ESM outputs
 *  2. Temporarily write patched manifests (with publish version) into each
 *     package dir so `pnpm pack` resolves workspace deps to that version
 *  3. `pnpm pack` each package, restore original package.json files
 *  4. Inject README + LICENSE + canonical repository into each tarball
 *  5. `npm publish` each tarball (OIDC in CI)
 *
 * To run from repo root:
 *   node --experimental-strip-types scripts/next-npm-version.mts
 *   node --experimental-strip-types scripts/publish.mts \
 *     --version 0.3.9-alpha.0 --dry-run
 */

import { spawnSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
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

interface Args {
  version: string
  registry: string
  dryRun: boolean
  skipBuild: boolean
}

/** Hardcoded: every publish lands on the npm "latest" dist-tag. */
const DIST_TAG = 'latest'

function parseArgs(): Args {
  const argv = process.argv.slice(2)
  const get = (flag: string): string | undefined => {
    const idx = argv.indexOf(flag)
    return idx !== -1 ? argv[idx + 1] : undefined
  }

  if (argv.includes('--tag')) {
    console.error(
      'Error: --tag is not supported; publishes always use the "latest" dist-tag'
    )
    process.exit(1)
  }

  const version = get('--version')
  if (version == null || version === '') {
    console.error('Error: --version <semver> is required')
    process.exit(1)
  }

  return {
    version,
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

interface PackageTarget {
  root: string
  patch: (
    pkg: Record<string, unknown>,
    version: string
  ) => Record<string, unknown>
}

const PACKAGE_TARGETS: PackageTarget[] = [
  { root: SHARED_DATA_ROOT, patch: patchSharedDataPackageJson },
  { root: STEP_GENERATION_ROOT, patch: patchStepGenerationPackageJson },
  { root: COMPONENTS_ROOT, patch: patchComponentsPackageJson },
  {
    root: PROTOCOL_VISUALIZATION_ROOT,
    patch: patchProtocolVisualizationPackageJson,
  },
]

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

/**
 * npm trusted publishing requires package.json repository.url to match the
 * GitHub repo exactly. Normalize away git+ prefixes / .git variants.
 * @see https://docs.npmjs.com/trusted-publishers#troubleshooting
 */
const CANONICAL_REPOSITORY = {
  type: 'git',
  url: 'https://github.com/Opentrons/opentrons.git',
} as const

function withCanonicalRepository(
  pkg: Record<string, unknown>
): Record<string, unknown> {
  return {
    ...pkg,
    repository: { ...CANONICAL_REPOSITORY },
  }
}

function packageJsonPath(packageRoot: string): string {
  return path.join(packageRoot, 'package.json')
}

function tarballFileName(packageName: string, version: string): string {
  return `${packageName.replace('@', '').replace('/', '-')}-${version}.tgz`
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
        `\n  FATAL: ESM import failed for ${packageName} - likely a lodash CJS interop issue.\n` +
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

async function smokeTestComponentsLocalization(): Promise<void> {
  console.log('\n=== Smoke-testing Node-safe @opentrons/components/localization ===')
  const localizationPath = path.join(COMPONENTS_ROOT, 'lib', 'localization.mjs')
  try {
    const mod = await import(localizationPath)
    if (mod.shared_en_resources == null || mod.resources == null) {
      throw new Error('missing shared_en_resources or resources export')
    }
    console.log('  localization ESM smoke test PASSED')
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`\n  FATAL: localization import failed in bare Node.\n  Error: ${message}`)
    process.exit(1)
  }
}

// ---------------------------------------------------------------------------
// Temporarily patch source package.json files, pnpm pack, then restore
// ---------------------------------------------------------------------------

function withPatchedPackageJsons<T>(version: string, fn: () => T): T {
  const backups = PACKAGE_TARGETS.map(target => {
    const pkgPath = packageJsonPath(target.root)
    return {
      pkgPath,
      original: readFileSync(pkgPath, 'utf8'),
      patched: withCanonicalRepository(
        target.patch(readJson(pkgPath), version)
      ),
    }
  })

  try {
    // Write all versions before any pack so workspace:* resolves to publishVersion
    for (const backup of backups) {
      writeJson(backup.pkgPath, backup.patched)
      console.log(
        `  Wrote patched package.json for ${String(backup.patched.name)}@${version}`
      )
    }
    return fn()
  } finally {
    for (const backup of backups) {
      writeFileSync(backup.pkgPath, backup.original, 'utf8')
      console.log(`  Restored ${backup.pkgPath}`)
    }
  }
}

function pnpmPackPackage(
  packageRoot: string,
  packageName: string,
  version: string,
  packDest: string
): string {
  run(`pnpm pack --pack-destination "${packDest}"`, packageRoot)
  const tarball = path.join(packDest, tarballFileName(packageName, version))
  if (!existsSync(tarball)) {
    throw new Error(`Expected tarball missing after pnpm pack: ${tarball}`)
  }
  return tarball
}

/**
 * Extract a pnpm-packed tarball, inject README + LICENSE, re-pack with npm so
 * the published tarball matches what we intend to ship, then publish (or dry-run).
 */
function finalizeAndPublishTarball(
  packedTarball: string,
  version: string,
  args: Args
): void {
  const extractRoot = mkdtempSync(path.join(tmpdir(), 'opentrons-publish-'))
  try {
    run(`tar -xzf "${packedTarball}" -C "${extractRoot}"`, MONO_ROOT)
    const stagingDir = path.join(extractRoot, 'package')
    const pkg = withCanonicalRepository(readJson(packageJsonPath(stagingDir)))
    const name = pkg.name as string

    writeJson(packageJsonPath(stagingDir), pkg)
    writeFileSync(
      path.join(stagingDir, 'README.md'),
      makeReadme(name, version),
      'utf8'
    )
    try {
      cpSync(ROOT_LICENSE, path.join(stagingDir, 'LICENSE'))
    } catch {
      console.warn('  WARNING: could not copy root LICENSE - skipping')
    }

    if (args.dryRun) {
      console.log(`\n=== DRY RUN ${name}@${version} ===`)
      console.log(`  Would publish with tag "${DIST_TAG}"`)
      console.log('  package.json:')
      console.log(JSON.stringify(pkg, null, 2))
      console.log('\n  README.md:')
      console.log(makeReadme(name, version))
      run('npm pack --dry-run', stagingDir)
      return
    }

    // Re-pack after README/LICENSE injection, then publish the tarball.
    // npm CLI >= 11.5.1 uses OIDC trusted publishing in GHA when
    // id-token: write is set (no NPM_TOKEN needed).
    // TODO(pnpm-11): replace this npm publish with `pnpm publish` once the
    // monorepo is on pnpm 11+ (native OIDC Trusted Publishing).
    run('npm pack', stagingDir)
    const tarball = path.join(stagingDir, tarballFileName(name, version))
    run(
      `npm publish "${tarball}" --registry ${args.registry} --tag ${DIST_TAG} --access public`,
      stagingDir
    )
    console.log(`  Published ${name}@${version} with tag "${DIST_TAG}"`)
  } finally {
    rmSync(extractRoot, { recursive: true, force: true })
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const args = parseArgs()

  console.log(`\nPublish settings:`)
  console.log(`  version:  ${args.version}`)
  console.log(`  tag:      ${DIST_TAG}`)
  console.log(`  registry: ${args.registry}`)
  console.log(`  dry-run:  ${args.dryRun}`)
  console.log(`  pack:     pnpm pack (catalog/workspace rewrite)`)
  console.log(
    `  publish:  npm publish (OIDC on pnpm 10; pnpm publish on pnpm 11+)`
  )

  // Build order: shared-data first, then step-generation and components (Vite
  // aliases), then protocol-visualization (depends on published-style peers).
  buildSharedData(args.skipBuild)
  buildStepGeneration(args.skipBuild)
  buildComponents(args.skipBuild)
  buildProtocolVisualization(args.skipBuild)

  await smokeTestEsm(
    path.join(SHARED_DATA_ROOT, 'lib'),
    '@opentrons/shared-data'
  )
  await smokeTestEsm(
    path.join(STEP_GENERATION_ROOT, 'lib'),
    '@opentrons/step-generation'
  )
  await smokeTestEsm(path.join(COMPONENTS_ROOT, 'lib'), '@opentrons/components')
  await smokeTestComponentsLocalization()
  await smokeTestEsm(
    path.join(PROTOCOL_VISUALIZATION_ROOT, 'lib'),
    '@opentrons/protocol-visualization'
  )

  const packDest = mkdtempSync(path.join(tmpdir(), 'opentrons-pnpm-pack-'))
  try {
    const tarballs = withPatchedPackageJsons(args.version, () => {
      console.log('\n=== pnpm pack (rewrites catalog: / workspace:*) ===')
      return PACKAGE_TARGETS.map(target => {
        const name = readJson(packageJsonPath(target.root)).name as string
        return pnpmPackPackage(target.root, name, args.version, packDest)
      })
    })

    for (const tarball of tarballs) {
      console.log(`\n=== Finalize and publish ${path.basename(tarball)} ===`)
      finalizeAndPublishTarball(tarball, args.version, args)
    }
  } finally {
    rmSync(packDest, { recursive: true, force: true })
  }

  console.log('\nDone!')
  if (args.dryRun) {
    console.log('(dry-run mode - nothing was actually published)')
  }
}

main().catch(err => {
  console.error('\nPublish failed:', err instanceof Error ? err.message : err)
  process.exit(1)
})
