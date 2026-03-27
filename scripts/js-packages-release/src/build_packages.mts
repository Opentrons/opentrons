import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'

import { applyReleaseVersions } from './manifests.mjs'
import { PACKAGES, resolveVersionInput } from './publish_core.mjs'

interface BuildSummaryArgs {
  root: string
  ranBuild: boolean
  versionRaw: string | undefined
  resolvedVersion: string | null
  skipBuild: boolean
}

// Build in release order, because these packages are not independent:
// later packages consume earlier ones and the release process pins them to the
// same version as a synchronized set. Keep this in dependency/release order.
export const BUILD_COMMANDS = [
  ['make', 'build-ts'],
  ['make', '-C', 'shared-data', 'lib-js'],
  ['make', '-C', 'step-generation', 'lib'],
  ['make', '-C', 'components', 'build-ts'],
  ['make', '-C', 'components', 'lib'],
  ['make', '-C', 'protocol-visualization', 'build-ts'],
  ['make', '-C', 'protocol-visualization', 'lib'],
] as const

export function defaultRepoRoot(): string {
  return path.resolve(fileURLToPath(new URL('../../..', import.meta.url)))
}

export function run(
  command: readonly string[],
  cwd: string,
  env?: NodeJS.ProcessEnv
): void {
  console.log(`$ ${command.join(' ')} (cwd=${cwd})`)
  const result = spawnSync(command[0], [...command.slice(1)], {
    cwd,
    env: { ...process.env, ...(env ?? {}) },
    stdio: 'inherit',
  })

  if (result.status !== 0) {
    throw new Error(
      `Command failed with exit code ${result.status}: ${command.join(' ')}`
    )
  }
}

export function runBuild(repoRoot: string): void {
  for (const command of BUILD_COMMANDS) {
    run(command, repoRoot)
  }
}

function buildMode(args: BuildSummaryArgs): string {
  if (args.skipBuild && args.resolvedVersion != null) {
    return 'Manifests only (`--skip-build`)'
  }
  if (args.resolvedVersion != null) {
    return 'Build + release manifests'
  }
  return 'Build only (no `package.json` release rewrite)'
}

export function printBuildSummary(args: BuildSummaryArgs): void {
  const mode = buildMode(args)
  console.log(`Repo root: ${args.root}`)
  console.log(`Mode: ${mode}`)
  if (args.versionRaw != null) {
    console.log(`Version input: ${args.versionRaw}`)
  }
  if (args.resolvedVersion != null) {
    console.log(`Resolved version: ${args.resolvedVersion}`)
  }

  console.log('Build steps:')
  if (args.ranBuild) {
    for (const command of BUILD_COMMANDS) {
      console.log(`- ${command.join(' ')}`)
    }
  } else {
    console.log('- skipped (`--skip-build`)')
  }

  if (args.resolvedVersion != null) {
    console.log('package.json targets:')
    for (const packageName of PACKAGES) {
      console.log(`- ${packageName}`)
    }
  }

  console.log('Status: success')
}

export function main(argv: string[] = process.argv.slice(2)): number {
  const { values } = parseArgs({
    args: argv,
    options: {
      version: { type: 'string', short: 'v' },
      'repo-root': { type: 'string' },
      'skip-build': { type: 'boolean', default: false },
    },
    strict: true,
    allowPositionals: false,
  })

  if (values['skip-build'] === true && values.version == null) {
    console.error('--skip-build requires --version.')
    return 1
  }

  const root = values['repo-root'] ?? defaultRepoRoot()
  const ranBuild = values['skip-build'] !== true

  try {
    if (ranBuild) {
      runBuild(root)
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    return 1
  }

  let resolvedVersion: string | null = null
  if (values.version != null) {
    try {
      resolvedVersion = resolveVersionInput(values.version)
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error))
      return 1
    }
    applyReleaseVersions(root, resolvedVersion)
  }

  printBuildSummary({
    root,
    ranBuild,
    versionRaw: values.version,
    resolvedVersion,
    skipBuild: values['skip-build'] === true,
  })

  if (resolvedVersion == null) {
    console.log(
      `Build finished under ${root} (no package.json release rewrite).`
    )
  } else {
    console.log(`Applied release version ${resolvedVersion} under ${root}`)
  }
  return 0
}

if (
  process.argv[1] != null &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  process.exit(main())
}
