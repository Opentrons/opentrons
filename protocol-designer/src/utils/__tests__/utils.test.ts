import { describe, it, expect } from 'vitest'
import { removeOpentronsPhrases } from '..'

describe('removeOpentronsPhrases', () => {
  it('should remove "Opentrons Flex 96"', () => {
    const input = 'This is an Opentrons Flex 96 Tip Rack'
    const expectedOutput = 'This is an Tip Rack'
    expect(removeOpentronsPhrases(input)).toBe(expectedOutput)
  })

  it('should remove "Opentrons OT-2 96"', () => {
    const input = 'This is an Opentrons OT-2 96 Tip Rack'
    const expectedOutput = 'This is an Tip Rack'
    expect(removeOpentronsPhrases(input)).toBe(expectedOutput)
  })

  it('should remove "(Retired)"', () => {
    const input = 'This is a (Retired) Tip Rack'
    const expectedOutput = 'This is a Tip Rack'
    expect(removeOpentronsPhrases(input)).toBe(expectedOutput)
  })

  it('should remove "96" if it is not the first two characters', () => {
    const input = 'This is a Filter 96 Tip Rack'
    const expectedOutput = 'This is a Filter Tip Rack'
    expect(removeOpentronsPhrases(input)).toBe(expectedOutput)
  })

  it('should remove "96" if it is the first two characters', () => {
    const input = '96 Filter Tip Rack'
    const expectedOutput = 'Filter Tip Rack'
    expect(removeOpentronsPhrases(input)).toBe(expectedOutput)
  })

  it('should handle multiple phrases in the input', () => {
    const input = '(Retired) Opentrons Flex 96 and Opentrons OT-2 96 Tip Rack'
    const expectedOutput = 'and Tip Rack'
    expect(removeOpentronsPhrases(input)).toBe(expectedOutput)
  })

  it('should handle an empty input', () => {
    const input = ''
    const expectedOutput = ''
    expect(removeOpentronsPhrases(input)).toBe(expectedOutput)
  })

  it('should remove "Eppendorf" from input ', () => {
    const input = 'Eppendorf epT.I.P.S. Tip Rack is long'
    const expectedOutput = 'epT.I.P.S. Tip Rack is long'
    expect(removeOpentronsPhrases(input)).toBe(expectedOutput)
  })
})
