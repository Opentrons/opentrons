/**
 * npm-latest-versions.mts
 *
 * Prints dist-tags and versions for Opentrons JS packages on npm.
 * Default list includes the packages published by publish.mts; add names to
 * PACKAGES below or pass extra names as argv (after --).
 *
 * Run from repo root:
 *   node --experimental-strip-types scripts/npm-latest-versions.mts
 *
 * Options:
 *   --registry <url>   npm registry (default: https://registry.npmjs.org)
 *
 * Credentials (optional; public registry metadata is usually anonymous):
 *   The script sends no auth unless you set one of these env vars (first
 *   non-empty wins): NPM_TOKEN, NODE_AUTH_TOKEN, NPM_REGISTRY_TOKEN.
 *   Value is sent as: Authorization: Bearer <token>
 *   Prefer env vars over flags so tokens do not end up in shell history.
 *
 * Examples:
 *   node --experimental-strip-types scripts/npm-latest-versions.mts
 *   node --experimental-strip-types scripts/npm-latest-versions.mts --registry https://registry.npmjs.org -- @opentrons/api-client
 */

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const DEFAULT_REGISTRY = 'https://registry.npmjs.org'

const PACKAGES: string[] = [
  '@opentrons/shared-data',
  '@opentrons/step-generation',
  '@opentrons/components',
  '@opentrons/protocol-visualization',
]

function parseArgs(): { registry: string; extraPackages: string[] } {
  const argv = process.argv.slice(2)
  const get = (flag: string): string | undefined => {
    const idx = argv.indexOf(flag)
    return idx !== -1 ? argv[idx + 1] : undefined
  }

  const dashDash = argv.indexOf('--')
  const beforeDash = dashDash === -1 ? argv : argv.slice(0, dashDash)
  const afterDash = dashDash === -1 ? [] : argv.slice(dashDash + 1)

  const registryIdx = beforeDash.indexOf('--registry')
  const registry =
    registryIdx !== -1 && beforeDash[registryIdx + 1]
      ? beforeDash[registryIdx + 1]
      : DEFAULT_REGISTRY

  return {
    registry: registry.replace(/\/$/, ''),
    extraPackages: afterDash.filter(a => a.length > 0),
  }
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

function registryAuthToken(): string | undefined {
  for (const key of ['NPM_TOKEN', 'NODE_AUTH_TOKEN', 'NPM_REGISTRY_TOKEN']) {
    const v = process.env[key]?.trim()
    if (v) return v
  }
  return undefined
}

type NpmPackageDoc = {
  'dist-tags'?: Record<string, string>
  error?: string
}

async function fetchPackageDoc(
  registry: string,
  packageName: string,
  authToken: string | undefined
): Promise<NpmPackageDoc | null> {
  const base = registry.replace(/\/$/, '')
  const pathSeg = encodeURIComponent(packageName)
  const url = `${base}/${pathSeg}`

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`
  }

  const res = await fetch(url, { headers })

  if (res.status === 404) {
    return null
  }
  if (!res.ok) {
    throw new Error(`${packageName}: HTTP ${res.status} ${res.statusText}`)
  }

  return (await res.json()) as NpmPackageDoc
}

function formatDistTags(tags: Record<string, string> | undefined): string {
  if (!tags || Object.keys(tags).length === 0) {
    return '(none)'
  }
  return Object.entries(tags)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([tag, ver]) => `${tag}=${ver}`)
    .join(', ')
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const { registry, extraPackages } = parseArgs()
  const names = [...PACKAGES, ...extraPackages]
  const authToken = registryAuthToken()

  console.log(`Registry: ${registry}`)
  console.log(`Auth:     ${authToken ? 'Bearer token (from env)' : 'none'}\n`)

  for (const name of names) {
    try {
      const doc = await fetchPackageDoc(registry, name, authToken)
      if (!doc) {
        console.log(`${name}`)
        console.log(`  not found on registry\n`)
        continue
      }
      if (doc.error) {
        console.log(`${name}`)
        console.log(`  error: ${doc.error}\n`)
        continue
      }

      const tags = doc['dist-tags'] ?? {}
      const latest = tags.latest ?? '(no latest tag)'

      console.log(`${name}`)
      console.log(`  latest (dist-tag): ${latest}`)
      console.log(`  dist-tags:         ${formatDistTags(tags)}`)
      // blank line between packages for readability
      console.log('')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`${name}: ${msg}\n`)
    }
  }
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
