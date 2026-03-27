import semver from 'semver'

export const PACKAGES = [
  '@opentrons/shared-data',
  '@opentrons/step-generation',
  '@opentrons/components',
  '@opentrons/protocol-visualization',
] as const

export type PackageName = (typeof PACKAGES)[number]

export const TAG_PREFIX = 'js-packages-release@'
export const REF_PREFIX = 'refs/tags/'
export const DEFAULT_NPM_REGISTRY = 'https://npm.pkg.github.com'

export const PACKAGE_REL_DIRS: Record<PackageName, string> = {
  '@opentrons/shared-data': 'shared-data',
  '@opentrons/step-generation': 'step-generation',
  '@opentrons/components': 'components',
  '@opentrons/protocol-visualization': 'protocol-visualization',
}

export function parseSemver(version: string): string {
  const parsed = semver.valid(version)
  if (parsed == null) {
    throw new Error(
      `Invalid semver version '${version}'. Expected format like '1.2.3' or '1.2.3-beta.1'.`
    )
  }
  return parsed
}

export function validateSemver(version: string): string {
  return parseSemver(version)
}

export function resolveVersionInput(versionInput: string): string {
  let value = versionInput.trim()

  if (value.startsWith(REF_PREFIX)) {
    value = value.slice(REF_PREFIX.length)
  }
  if (value.startsWith(TAG_PREFIX)) {
    return validateSemver(value.slice(TAG_PREFIX.length))
  }
  if (value.includes('@')) {
    throw new Error(
      `Invalid tag prefix in '${versionInput}'. Expected '${TAG_PREFIX}<semver>' or a plain '<semver>'.`
    )
  }
  return validateSemver(value)
}

export function priorPackages(
  packageName: PackageName
): readonly PackageName[] {
  const index = PACKAGES.indexOf(packageName)
  return PACKAGES.slice(0, index)
}
