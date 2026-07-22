/**
 * next-npm-version.mts
 *
 * Reads the npm "latest" dist-tag for @opentrons/components and prints the
 * next patch alpha version (hardcoded strategy):
 *   0.3.8-alpha.0 -> 0.3.9-alpha.0
 *
 * Run from repo root:
 *   node --experimental-strip-types scripts/next-npm-version.mts
 *
 * Prints only the version string to stdout (suitable for CI capture).
 */

const REGISTRY = 'https://registry.npmjs.org'
const PACKAGE_NAME = '@opentrons/components'
const DIST_TAG = 'latest'

type NpmPackageDoc = {
  'dist-tags'?: Record<string, string>
  error?: string
}

async function fetchPackageDoc(
  registry: string,
  packageName: string
): Promise<NpmPackageDoc | null> {
  const url = `${registry}/${encodeURIComponent(packageName)}`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (res.status === 404) return null
  if (!res.ok) {
    throw new Error(`${packageName}: HTTP ${res.status} ${res.statusText}`)
  }
  return (await res.json()) as NpmPackageDoc
}

/** 0.3.8-alpha.0 (or 0.3.8) -> 0.3.9-alpha.0 */
function nextPatchAlpha(current: string): string {
  const match = current.match(/^(\d+)\.(\d+)\.(\d+)(?:-alpha\.(\d+))?$/)
  if (!match) {
    throw new Error(
      `Unsupported version format "${current}". Expected X.Y.Z or X.Y.Z-alpha.N`
    )
  }

  const major = Number(match[1])
  const minor = Number(match[2])
  const patch = Number(match[3])
  return `${major}.${minor}.${patch + 1}-alpha.0`
}

async function main(): Promise<void> {
  const doc = await fetchPackageDoc(REGISTRY, PACKAGE_NAME)

  if (!doc) {
    process.stdout.write('0.1.0-alpha.0\n')
    return
  }
  if (doc.error) {
    throw new Error(`${PACKAGE_NAME}: ${doc.error}`)
  }

  const current = doc['dist-tags']?.[DIST_TAG]
  if (!current) {
    throw new Error(`${PACKAGE_NAME}: no "${DIST_TAG}" dist-tag on registry`)
  }

  process.stdout.write(`${nextPatchAlpha(current)}\n`)
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
