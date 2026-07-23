/**
 * Shared package.json patching for npm publish and js-package-testing pack/.
 *
 * Single source of truth: both scripts/publish.mts and
 * scripts/patch-packed-packages.mts import from this module.
 * Do not duplicate patch logic elsewhere; if published manifests change, edit
 * here so pack/ and npm stay aligned.
 *
 * Protocol rewrite ownership:
 *   - `catalog:` / `workspace:*` → left for `pnpm pack` (do not rewrite here)
 *   - publish.mts temporarily sets each package version, then runs `pnpm pack`,
 *     so workspace deps resolve to the publish semver instead of 0.0.0-dev
 *
 * What this module still owns (monorepo debt / consumer hygiene):
 *   - move `@types/*` (and a few unused runtime deps) out of dependencies
 *   - peerDependency ranges preferred for external consumers (`^…`)
 *   - `files` allowlists and `exports` maps
 *
 * README/LICENSE file contents are written by publish.mts, not here.
 *
 * Follow-up (when the monorepo moves to pnpm 11): switch the publish step from
 * `npm publish` to `pnpm publish` for native OIDC Trusted Publishing. Keep
 * `pnpm pack` (or equivalent) for protocol rewriting until then.
 */

/** Peer dependency ranges recommended for external consumers. */
export const PEER_VERSION_RANGES: Record<string, string> = {
  react: '^18.2.0',
  'react-dom': '^18.2.0',
  'react-i18next': '^14.0.0',
  i18next: '^19.8.3',
}

/**
 * Prefer npm-friendly peer ranges. Leaves unknown peers unchanged
 * (including values already rewritten by `pnpm pack`).
 */
export function resolvePeerDependencyRange(
  depName: string,
  range: string
): string {
  return PEER_VERSION_RANGES[depName] ?? range
}

/**
 * Move `@types/*` out of runtime dependencies. Leave all other ranges as-is
 * so `pnpm pack` can rewrite `catalog:` / `workspace:*`.
 */
export function patchDependencySections(
  pkg: Record<string, unknown>
): Record<string, unknown> {
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
    cleanDeps[name] = range
  }

  const peerDeps: Record<string, string> = {}
  for (const [name, range] of Object.entries(
    (pkg.peerDependencies as Record<string, string> | undefined) ?? {}
  )) {
    peerDeps[name] = resolvePeerDependencyRange(name, range)
  }

  return {
    ...pkg,
    dependencies: cleanDeps,
    devDependencies: devDeps,
    ...(Object.keys(peerDeps).length > 0 ? { peerDependencies: peerDeps } : {}),
  }
}

const COMPONENTS_TYPE_ONLY_DEPS = new Set([
  '@types/classnames',
  '@types/lodash',
  '@types/styled-components',
  '@types/webpack-env',
])

const COMPONENTS_UNUSED_RUNTIME_DEPS = new Set(['interactjs'])

export function patchSharedDataPackageJson(
  pkg: Record<string, unknown>,
  version: string
): Record<string, unknown> {
  const patched = patchDependencySections(pkg)

  return {
    ...patched,
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
  }
}

export function patchStepGenerationPackageJson(
  pkg: Record<string, unknown>,
  version: string
): Record<string, unknown> {
  const patched = patchDependencySections(pkg)

  return {
    ...patched,
    version,
    files: ['lib/', 'README.md', 'LICENSE'],
  }
}

export function patchComponentsPackageJson(
  pkg: Record<string, unknown>,
  version: string
): Record<string, unknown> {
  const devDeps: Record<string, string> = {
    ...((pkg.devDependencies as Record<string, string> | undefined) ?? {}),
  }
  const cleanDeps: Record<string, string> = {}

  for (const [name, range] of Object.entries(
    (pkg.dependencies as Record<string, string> | undefined) ?? {}
  )) {
    if (
      COMPONENTS_TYPE_ONLY_DEPS.has(name) ||
      COMPONENTS_UNUSED_RUNTIME_DEPS.has(name)
    ) {
      devDeps[name] = range
      continue
    }
    cleanDeps[name] = range
  }

  const peerDeps: Record<string, string> = {}
  for (const [name, range] of Object.entries(
    (pkg.peerDependencies as Record<string, string> | undefined) ?? {}
  )) {
    peerDeps[name] = resolvePeerDependencyRange(name, range)
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
    files: [
      'lib/',
      'src/styles/',
      'src/index.module.css',
      'README.md',
      'LICENSE',
    ],
    dependencies: cleanDeps,
    devDependencies: devDeps,
    peerDependencies: peerDeps,
  }
}

export function patchProtocolVisualizationPackageJson(
  pkg: Record<string, unknown>,
  version: string
): Record<string, unknown> {
  const patched = patchDependencySections(pkg)

  return {
    ...patched,
    version,
    exports: {
      '.': {
        types: './lib/index.d.ts',
        import: './lib/index.mjs',
        require: './lib/index.js',
        default: './lib/index.mjs',
      },
      './styles': './lib/style.css',
      './lib/style.css': './lib/style.css',
      './package.json': './package.json',
    },
    files: ['lib/', 'README.md', 'LICENSE'],
  }
}

export function patchPackageJsonByName(
  pkg: Record<string, unknown>,
  version: string
): Record<string, unknown> {
  const name = pkg.name as string

  switch (name) {
    case '@opentrons/shared-data':
      return patchSharedDataPackageJson(pkg, version)
    case '@opentrons/step-generation':
      return patchStepGenerationPackageJson(pkg, version)
    case '@opentrons/components':
      return patchComponentsPackageJson(pkg, version)
    case '@opentrons/protocol-visualization':
      return patchProtocolVisualizationPackageJson(pkg, version)
    default:
      throw new Error(`Unknown package name for patching: ${name}`)
  }
}
