/**
 * Shared package.json patching for npm publish and js-package-testing pack/.
 *
 * Single source of truth: both scripts/publish.mts and
 * scripts/patch-packed-packages.mts import from this module.
 * Do not duplicate patch logic elsewhere; if published manifests change, edit
 * here so pack/ and npm stay aligned.
 *
 * This is where catalog / workspace / peerDependency rewriting actually lives.
 * publish.mts only imports these helpers; it does not reimplement them.
 *
 * Monorepo manifests use workspace, link, and catalog specifiers that are
 * invalid for external npm consumers. These helpers rewrite them to concrete
 * semver strings and apply other publish-time fixes (exports, files allowlists).
 * README/LICENSE file contents are written by publish.mts, not here.
 */

/** Matches pnpm-workspace.yaml catalog entries used by the four library packages. */
export const MONOREPO_CATALOG: Record<string, string> = {
  lodash: '4.18.1',
  'react-i18next': '14.0.0',
  '@types/lodash': '4.17.24',
}

/** Matches pnpm-workspace.yaml catalogs.react18 entries. */
export const REACT18_CATALOG: Record<string, string> = {
  react: '18.2.0',
  'react-dom': '18.2.0',
  '@types/react-dom': '18.2.0',
}

/** Peer dependency ranges recommended for external consumers. */
export const PEER_VERSION_RANGES: Record<string, string> = {
  react: '^18.2.0',
  'react-dom': '^18.2.0',
  'react-i18next': '^14.0.0',
  i18next: '^19.8.3',
}

export function isMonorepoLocalRange(range: string): boolean {
  return range === 'workspace:*' || range.startsWith('link:')
}

export function resolveDependencyRange(
  depName: string,
  range: string,
  publishVersion: string
): string {
  if (isMonorepoLocalRange(range)) {
    if (depName.startsWith('@opentrons/')) {
      return publishVersion
    }
    console.warn(
      `  WARNING: unknown monorepo-local dep ${depName}=${range}, rewriting to "*"`
    )
    return '*'
  }

  if (range === 'catalog:react18') {
    return REACT18_CATALOG[depName] ?? PEER_VERSION_RANGES[depName] ?? '^18.2.0'
  }

  if (range === 'catalog:' || range.startsWith('catalog:')) {
    const resolved = MONOREPO_CATALOG[depName]
    if (resolved != null) {
      return resolved
    }
    console.warn(`  WARNING: unknown catalog dep ${depName}=${range}`)
    return range
  }

  return range
}

export function resolvePeerDependencyRange(
  depName: string,
  range: string
): string {
  if (range === 'catalog:react18') {
    return PEER_VERSION_RANGES[depName] ?? '^18.2.0'
  }

  if (range === 'catalog:' || range.startsWith('catalog:')) {
    return PEER_VERSION_RANGES[depName] ?? MONOREPO_CATALOG[depName] ?? range
  }

  return range
}

export function patchDependencySections(
  pkg: Record<string, unknown>,
  publishVersion: string
): Record<string, unknown> {
  const devDeps: Record<string, string> = {
    ...((pkg.devDependencies as Record<string, string> | undefined) ?? {}),
  }
  const cleanDeps: Record<string, string> = {}

  for (const [name, range] of Object.entries(
    (pkg.dependencies as Record<string, string> | undefined) ?? {}
  )) {
    if (name.startsWith('@types/')) {
      devDeps[name] = resolveDependencyRange(name, range, publishVersion)
      continue
    }
    cleanDeps[name] = resolveDependencyRange(name, range, publishVersion)
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
  const patched = patchDependencySections(pkg, version)

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
  const patched = patchDependencySections(pkg, version)

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
      devDeps[name] = resolveDependencyRange(name, range, version)
      continue
    }
    cleanDeps[name] = resolveDependencyRange(name, range, version)
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
  const patched = patchDependencySections(pkg, version)

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
