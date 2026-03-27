import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import { applyReleaseVersions, packageJsonPath } from '../src/manifests.mts'
import {
  PACKAGE_REL_DIRS,
  PACKAGES,
  priorPackages,
} from '../src/publish_core.mts'

const tempDirs: string[] = []

afterEach(() => {
  while (tempDirs.length > 0) {
    const tempDir = tempDirs.pop()
    if (tempDir != null) {
      rmSync(tempDir, { recursive: true, force: true })
    }
  }
})

describe('priorPackages', () => {
  it('matches publish order', () => {
    expect(priorPackages('@opentrons/shared-data')).toEqual([])
    expect(priorPackages('@opentrons/step-generation')).toEqual([
      '@opentrons/shared-data',
    ])
    expect(priorPackages('@opentrons/components')).toEqual([
      '@opentrons/shared-data',
      '@opentrons/step-generation',
    ])
    expect(priorPackages('@opentrons/protocol-visualization')).toEqual([
      '@opentrons/shared-data',
      '@opentrons/step-generation',
      '@opentrons/components',
    ])
  })
})

describe('applyReleaseVersions', () => {
  it('updates versions and pins internal dependencies', () => {
    const root = mkdtempSync(path.join(os.tmpdir(), 'js-packages-release-'))
    tempDirs.push(root)

    for (const packageName of PACKAGES) {
      const packageDir = path.join(root, PACKAGE_REL_DIRS[packageName])
      mkdirSync(packageDir, { recursive: true })

      const dependencies: Record<string, string> = { lodash: '4.17.21' }
      for (const priorPackage of priorPackages(packageName)) {
        dependencies[priorPackage] = 'link:../dummy'
      }

      writeFileSync(
        path.join(packageDir, 'package.json'),
        `${JSON.stringify(
          {
            name: packageName,
            version: '0.0.0-dev',
            dependencies,
          },
          null,
          2
        )}\n`,
        'utf8'
      )
    }

    applyReleaseVersions(root, '9.8.7')

    for (const packageName of PACKAGES) {
      const payload = JSON.parse(
        readFileSync(packageJsonPath(root, packageName), 'utf8')
      ) as {
        version: string
        dependencies: Record<string, string>
      }

      expect(payload.version).toBe('9.8.7')
      for (const priorPackage of priorPackages(packageName)) {
        expect(payload.dependencies[priorPackage]).toBe('9.8.7')
      }
      expect(payload.dependencies.lodash).toBe('4.17.21')
    }
  })

  it('updates versions even when dependencies are missing', () => {
    const root = mkdtempSync(path.join(os.tmpdir(), 'js-packages-release-'))
    tempDirs.push(root)

    for (const packageName of PACKAGES) {
      const packageDir = path.join(root, PACKAGE_REL_DIRS[packageName])
      mkdirSync(packageDir, { recursive: true })
      writeFileSync(
        path.join(packageDir, 'package.json'),
        `${JSON.stringify({ name: packageName, version: '0.0.0-dev' })}\n`,
        'utf8'
      )
    }

    applyReleaseVersions(root, '1.0.0')

    for (const packageName of PACKAGES) {
      const payload = JSON.parse(
        readFileSync(packageJsonPath(root, packageName), 'utf8')
      ) as { version: string }
      expect(payload.version).toBe('1.0.0')
    }
  })
})
