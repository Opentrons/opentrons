import { describe, expect, it } from 'vitest'

const {
  versionPrevious,
  compareVersions,
  releaseKind,
} = require('../create-release')

const HISTORICAL_VERSIONS = [
  '1.2.3-alpha.0',
  '1.2.2',
  '1.2.2-candidate-c',
  '1.2.2-beta.1',
  '1.2.1',
  '1.2.1-beta.3',
  '1.2.1-candidate-b',
  '1.2.1-beta.2',
  '1.2.1-alpha.3',
  '1.2.1-alpha.2',
  '1.2.1-beta.1',
  '1.2.1-candidate-a',
  '1.2.0',
  '1.1.9-alpha.2',
  '1.1.9-candidate-d',
  '1.1.9-beta.0',
  '1.1.9-alpha.0',
]

describe('create-release script', () => {
  it(`should pull the last production version for a production version`, () => {
    return expect(versionPrevious('1.2.2', HISTORICAL_VERSIONS)).toBe('1.2.1')
  })
  it(`should return null if it cannot find a recent production version for a production`, () => {
    return expect(versionPrevious('1.2.0', HISTORICAL_VERSIONS)).toBeNull()
  })
})

describe('OT-2 external calendar semver', () => {
  it('sorts stable and alpha builds by semver', () => {
    expect(compareVersions('26.6.0-alpha.0', '26.6.0')).toBeLessThan(0)
    expect(compareVersions('26.6.0', '26.6.1')).toBeLessThan(0)
    expect(compareVersions('26.6.0-alpha.0', '26.6.0-alpha.1')).toBeLessThan(0)
  })
  it('uses semver prerelease for release kind', () => {
    expect(releaseKind('26.6.0')).toBe('production')
    expect(releaseKind('26.6.0-alpha.0')).toBe('alpha')
    expect(releaseKind('26.6.0-beta.0')).toBe('beta')
  })
  it('versionPrevious for alpha picks prior alpha or stable', () => {
    const prev = ['26.6.0-alpha.1', '26.6.0-alpha.0', '26.6.0', '26.5.9']
    expect(versionPrevious('26.6.0-alpha.1', prev)).toBe('26.6.0-alpha.0')
  })
})

describe('OT-2 internal calendar semver', () => {
  it('sorts DNN patch builds', () => {
    expect(compareVersions('26.5.2601-alpha', '26.5.2601')).toBeLessThan(0)
    expect(compareVersions('26.5.2601', '26.5.2602-alpha')).toBeLessThan(0)
  })
})
