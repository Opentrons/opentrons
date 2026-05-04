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
  it(`should generate changes since a recent production version for a candidate`, () => {
    return expect(
      versionPrevious('1.2.2-candidate-c', HISTORICAL_VERSIONS)
    ).toBe('1.2.1')
  })
  it(`should generate changes since a recent candidate version for a candidate`, () => {
    return expect(
      versionPrevious('1.2.1-candidate-b', HISTORICAL_VERSIONS)
    ).toBe('1.2.1-candidate-a')
  })
  it(`should return null if it cannot find a recent version for a candidate`, () => {
    return expect(
      versionPrevious('1.1.9-candidate-d', HISTORICAL_VERSIONS)
    ).toBeNull()
  })
  it(`should generate changes since a recent production version for a beta`, () => {
    return expect(versionPrevious('1.2.2-beta.1', HISTORICAL_VERSIONS)).toBe(
      '1.2.1'
    )
  })
  it(`should generate changes since a recent version for a beta`, () => {
    return expect(versionPrevious('1.2.1-beta.3', HISTORICAL_VERSIONS)).toBe(
      '1.2.1-candidate-b'
    )
  })
  it(`should generate changes since a recent beta version for a beta`, () => {
    return expect(versionPrevious('1.2.1-beta.2', HISTORICAL_VERSIONS)).toBe(
      '1.2.1-beta.1'
    )
  })
  it(`should return null if it cannot find a recent version for a beta`, () => {
    return expect(
      versionPrevious('1.1.9-beta.0', HISTORICAL_VERSIONS)
    ).toBeNull()
  })
  it(`should generate changes since a recent production version for an alpha`, () => {
    return expect(versionPrevious('1.2.3-alpha.0', HISTORICAL_VERSIONS)).toBe(
      '1.2.2'
    )
  })
  it(`should generate changes since a recent candidate version for an alpha`, () => {
    return expect(versionPrevious('1.1.9-alpha.2', HISTORICAL_VERSIONS)).toBe(
      '1.1.9-candidate-d'
    )
  })
  it(`should generate changes since a recent beta version for an alpha`, () => {
    return expect(versionPrevious('1.2.1-alpha.2', HISTORICAL_VERSIONS)).toBe(
      '1.2.1-beta.1'
    )
  })
  it(`should generate changes since a recent alpha version for an alpha`, () => {
    return expect(versionPrevious('1.2.1-alpha.3', HISTORICAL_VERSIONS)).toBe(
      '1.2.1-alpha.2'
    )
  })
  it(`should return null if it cannot find a recent version for an alpha`, () => {
    return expect(
      versionPrevious('1.1.9-alpha.0', HISTORICAL_VERSIONS)
    ).toBeNull()
  })
})

describe('calendar robot tags (vYY.MM / vYY.MM@alpha.N)', () => {
  it('orders per semver on comparable strings (prerelease < release)', () => {
    expect(compareVersions('26.04@alpha.0', '26.04')).toBeLessThan(0)
    expect(compareVersions('26.04@alpha.0', '26.04@alpha.1')).toBeLessThan(0)
  })
  it('versionPrevious for calendar alpha uses prior stable', () => {
    const prev = ['26.04@alpha.0', '26.04', '26.03@alpha.2', '26.03']
    expect(versionPrevious('26.04@alpha.0', prev)).toBe('26.04')
  })
})

describe('internal calendar version strings (tag suffix after internal@)', () => {
  it('sorts YY.MM.DD and same-day .N bumps (mapped alpha < bare day)', () => {
    expect(compareVersions('26.04.23.1', '26.04.23')).toBeLessThan(0)
    expect(compareVersions('26.04.22', '26.04.23')).toBeLessThan(0)
  })
  it('treats calendar internal and legacy channel as alpha for changelog window', () => {
    expect(releaseKind('26.04.23')).toBe('alpha')
    expect(releaseKind('26.04.23.2')).toBe('alpha')
    expect(releaseKind('26.04.23-dev')).toBe('alpha')
    expect(releaseKind('26.04.23-prod.1')).toBe('alpha')
  })
  it('versionPrevious for internal alpha picks newest older than current', () => {
    const prev = ['26.04.24.1', '26.04.24', '26.04.23.2', '26.04.22']
    expect(versionPrevious('26.04.24.1', prev)).toBe('26.04.24')
  })
})
