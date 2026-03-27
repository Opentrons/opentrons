import { spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'
import semver from 'semver'

import {
  DEFAULT_NPM_REGISTRY,
  PACKAGES,
  parseSemver,
  resolveVersionInput,
} from './publish_core.mjs'

import type { PackageName } from './publish_core.mjs'

export type PackageVersions = Record<PackageName, string[]>

export function npmRegistry(): string {
  return process.env.OT_NPM_REGISTRY ?? DEFAULT_NPM_REGISTRY
}

export function fetchPublishedVersions(packageName: string): string[] {
  const registry = npmRegistry()
  const result = spawnSync(
    'npm',
    ['view', packageName, 'versions', '--json', '--registry', registry],
    { encoding: 'utf8' }
  )

  if (result.status !== 0) {
    const stderr = result.stderr.trim()
    if (stderr.includes('E404') || stderr.includes('is not in this registry')) {
      return []
    }
    throw new Error(
      `Failed reading versions for ${packageName} from ${registry}: ${stderr}`
    )
  }

  const output = result.stdout.trim()
  if (output === '') {
    return []
  }

  const parsed: unknown = JSON.parse(output)
  if (Array.isArray(parsed)) {
    return parsed.map(version => String(version))
  }
  if (typeof parsed === 'string') {
    return [parsed]
  }

  throw new Error(
    `Unexpected npm response for ${packageName}: ${String(parsed)}`
  )
}

export function latestSemver(versions: string[]): string | null {
  let latest: string | null = null

  for (const version of versions) {
    const parsed = semver.valid(version)
    if (parsed == null) {
      continue
    }
    if (latest == null || semver.gt(parsed, latest)) {
      latest = parsed
    }
  }

  return latest
}

export function checkTargetVersion(
  version: string,
  packageVersions: PackageVersions
): string[] {
  const issues: string[] = []
  const target = parseSemver(version)
  const alreadyPublished = new Set<string>()

  for (const packageName of PACKAGES) {
    const versions = packageVersions[packageName]
    if (versions.includes(version)) {
      alreadyPublished.add(packageName)
    }

    const latest = latestSemver(versions)
    if (latest === null || versions.includes(version)) {
      continue
    }
    if (!semver.gt(target, latest)) {
      issues.push(
        `${packageName} latest is ${latest}. Target ${version} must be greater than the latest published version.`
      )
    }
  }

  if (alreadyPublished.size > 0 && alreadyPublished.size === PACKAGES.length) {
    issues.push(
      `Target ${version} is already published for all packages. npm does not allow overwriting an existing version.`
    )
  } else if (alreadyPublished.size > 0) {
    const publishedPackages = Array.from(alreadyPublished).sort().join(', ')
    issues.push(
      `Partial publish detected for ${version}: already published for ${publishedPackages}, but not all packages.`
    )
  }

  return issues
}

export function loadPackageVersions(): PackageVersions {
  return Object.fromEntries(
    PACKAGES.map(packageName => [
      packageName,
      fetchPublishedVersions(packageName),
    ])
  ) as PackageVersions
}

export function printPreflightSummary(
  version: string,
  packageVersions: PackageVersions
): void {
  console.log(`Requested version: ${version}`)
  console.log(`Registry: ${npmRegistry()}`)
  for (const packageName of PACKAGES) {
    const versions = packageVersions[packageName]
    const latest = latestSemver(versions) ?? 'none'
    const targetExists = versions.includes(version) ? 'yes' : 'no'
    console.log(
      `${packageName}: latest=${latest} target_exists=${targetExists}`
    )
  }
}

export function printCurrentVersions(packageVersions: PackageVersions): void {
  console.log(`Registry: ${npmRegistry()}`)
  for (const packageName of PACKAGES) {
    const versions = packageVersions[packageName]
    const latest = latestSemver(versions) ?? 'none'
    console.log(
      `${packageName}: latest=${latest} published_count=${versions.length}`
    )
  }
}

export function main(argv: string[] = process.argv.slice(2)): number {
  const { values } = parseArgs({
    args: argv,
    options: {
      version: { type: 'string' },
      current: { type: 'boolean', default: false },
    },
    strict: true,
    allowPositionals: false,
  })

  if (values.current === true && values.version != null) {
    console.error('--current cannot be combined with --version.')
    return 1
  }
  if (values.current !== true && values.version == null) {
    console.error('either --version or --current is required.')
    return 1
  }

  let packageVersions: PackageVersions
  try {
    packageVersions = loadPackageVersions()
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    return 1
  }

  if (values.current === true) {
    printCurrentVersions(packageVersions)
    return 0
  }

  const versionInput = values.version
  if (versionInput == null) {
    console.error('either --version or --current is required.')
    return 1
  }

  let resolvedVersion: string
  try {
    resolvedVersion = resolveVersionInput(versionInput)
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    return 1
  }

  printPreflightSummary(resolvedVersion, packageVersions)

  const issues = checkTargetVersion(resolvedVersion, packageVersions)
  if (issues.length > 0) {
    for (const issue of issues) {
      console.error(issue)
    }
    return 1
  }

  console.log('Preflight checks passed.')
  return 0
}

if (
  process.argv[1] != null &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  process.exit(main())
}
