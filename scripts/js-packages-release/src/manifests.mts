import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { PACKAGE_REL_DIRS, PACKAGES, priorPackages } from './publish_core.mjs'

import type { PackageName } from './publish_core.mjs'

interface ReleasePackageJson {
  version?: string
  dependencies?: Record<string, string>
  [key: string]: unknown
}

export function packageJsonPath(
  repoRoot: string,
  packageName: PackageName
): string {
  return path.join(repoRoot, PACKAGE_REL_DIRS[packageName], 'package.json')
}

export function applyReleaseVersions(repoRoot: string, version: string): void {
  for (const packageName of PACKAGES) {
    const packagePath = packageJsonPath(repoRoot, packageName)
    const payload = JSON.parse(
      readFileSync(packagePath, 'utf8')
    ) as ReleasePackageJson

    payload.version = version

    const dependencies = payload.dependencies
    if (dependencies != null) {
      const dependencyMap = dependencies
      for (const priorPackage of priorPackages(packageName)) {
        if (priorPackage in dependencyMap) {
          dependencyMap[priorPackage] = version
        }
      }
      payload.dependencies = dependencyMap
    }

    writeFileSync(packagePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  }
}
