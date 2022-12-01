const { versionPrevious } = require('../create-release')

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
]

describe('create-release script', () => {
  it(`should pull the last production version for a production version`, () => {
    return expect(versionPrevious('1.2.2', HISTORICAL_VERSIONS)).toBe('1.2.1')
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
  it(`should generate changes since a recent production version for a beta`, () => {
    return expect(versionPrevious('1.2.2-beta.1', HISTORICAL_VERSIONS)).toBe(
      '1.2.1'
    )
  })
  it(`should generate changes since a recent candidate version for a beta`, () => {
    return expect(versionPrevious('1.2.1-beta.3', HISTORICAL_VERSIONS)).toBe(
      '1.2.1-candidate-b'
    )
  })
  it(`should generate changes since a recent beta version for a beta`, () => {
    return expect(versionPrevious('1.2.1-beta.2', HISTORICAL_VERSIONS)).toBe(
      '1.2.1-beta.1'
    )
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
})
