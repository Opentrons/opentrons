import {
  getAttachedProtocolModuleMatches,
  getUnmatchedModulesForProtocol,
} from '../utils'

describe('getAttachedProtocolModuleMatches', () => {
  it('returns no module matches when no modules attached', () => {
    const result = getAttachedProtocolModuleMatches([], [])
    expect(result).toEqual([])
  })

  // TODO(bh, 2023-02-27): additional test coverage
})

describe('getUnmatchedModulesForProtocol', () => {
  it('returns no missing module ids or remaining attached modules when no modules required or attached', () => {
    const result = getUnmatchedModulesForProtocol([], [])
    expect(result).toEqual({
      missingModuleIds: [],
      remainingAttachedModules: [],
    })
  })

  // TODO(bh, 2023-02-27): additional test coverage
})
