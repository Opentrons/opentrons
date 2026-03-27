import { describe, expect, it } from 'vitest'

import { resolveVersionInput } from '../src/publish_core.mts'
import { checkTargetVersion } from '../src/publish.mts'

describe('resolveVersionInput', () => {
  it.each([
    ['1.2.3', '1.2.3'],
    ['js-packages-release@1.2.3', '1.2.3'],
    ['refs/tags/js-packages-release@1.2.3', '1.2.3'],
    [' refs/tags/js-packages-release@2.0.0 ', '2.0.0'],
    ['js-packages-release@1.2.3-alpha.1', '1.2.3-alpha.1'],
    ['refs/tags/js-packages-release@2.0.0-beta.2', '2.0.0-beta.2'],
  ])('accepts %s', (versionInput, expected) => {
    expect(resolveVersionInput(versionInput)).toBe(expected)
  })

  it.each([
    ['refs/tags/js-packages-release@abc', 'Invalid semver version'],
    ['refs/tags/js-packages-release@1.2.3-beta.', 'Invalid semver version'],
    ['refs/tags/js-packages-release@1.2.3-beta..2', 'Invalid semver version'],
    [
      'refs/tags/js-packages-release@1.2.3-alpha.1.3.',
      'Invalid semver version',
    ],
    ['refs/tags/components@1.2.3', 'Invalid tag prefix'],
    ['refs/tags/components@1.2.3-alpha.1', 'Invalid tag prefix'],
    ['components@1.2.3', 'Invalid tag prefix'],
    ['shared-data@2.0.0-beta.2', 'Invalid tag prefix'],
    ['refs/tags/not-js-packages@2.0.0', 'Invalid tag prefix'],
  ])('rejects %s', (versionInput, errorMatch) => {
    expect(() => resolveVersionInput(versionInput)).toThrow(errorMatch)
  })
})

describe('checkTargetVersion', () => {
  it('allows a new version when packages are behind or unpublished', () => {
    const issues = checkTargetVersion('1.1.0', {
      '@opentrons/shared-data': ['1.0.0'],
      '@opentrons/step-generation': [],
      '@opentrons/components': ['1.0.0'],
      '@opentrons/protocol-visualization': [],
    })

    expect(issues).toEqual([])
  })

  it('allows a first publish when all packages are unpublished', () => {
    const issues = checkTargetVersion('1.0.0', {
      '@opentrons/shared-data': [],
      '@opentrons/step-generation': [],
      '@opentrons/components': [],
      '@opentrons/protocol-visualization': [],
    })

    expect(issues).toEqual([])
  })

  it('flags versions already published for all packages', () => {
    const issues = checkTargetVersion('1.1.0', {
      '@opentrons/shared-data': ['1.1.0'],
      '@opentrons/step-generation': ['1.1.0'],
      '@opentrons/components': ['1.1.0'],
      '@opentrons/protocol-visualization': ['1.1.0'],
    })

    expect(
      issues.some(issue => issue.includes('already published for all packages'))
    ).toBe(true)
  })

  it('flags non-incrementing targets for published packages', () => {
    const issues = checkTargetVersion('1.1.0', {
      '@opentrons/shared-data': ['1.2.0'],
      '@opentrons/step-generation': [],
      '@opentrons/components': ['1.0.0'],
      '@opentrons/protocol-visualization': [],
    })

    expect(
      issues.some(issue =>
        issue.includes('@opentrons/shared-data latest is 1.2.0')
      )
    ).toBe(true)
  })

  it('flags partial publish state', () => {
    const issues = checkTargetVersion('1.1.0', {
      '@opentrons/shared-data': ['1.1.0'],
      '@opentrons/step-generation': [],
      '@opentrons/components': [],
      '@opentrons/protocol-visualization': [],
    })

    expect(issues).toHaveLength(1)
    expect(issues[0]).toContain('Partial publish detected')
  })
})
