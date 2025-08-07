import { describe, expect, it } from 'vitest'

import { getIsTouchTipEnabled } from '../../utils/getIsTouchTipEnabled'

import type { LabwareDefinition2 } from '@opentrons/shared-data'

describe('getIsTouchTipEnabled', () => {
  it('should return true if the source or destination does not have quirks', () => {
    const sourceOrDestination = {
      parameters: {},
    } as LabwareDefinition2
    expect(getIsTouchTipEnabled(sourceOrDestination)).toBe(true)
  })
  it('should return true if the source or destination does not have touchTipDisabled quirk', () => {
    const sourceOrDestination = {
      parameters: { quirks: ['someQuirk'] },
    } as LabwareDefinition2
    expect(getIsTouchTipEnabled(sourceOrDestination)).toBe(true)
  })
  it('should return false if the source or destination has touchTipDisabled quirk', () => {
    const sourceOrDestination = {
      parameters: { quirks: ['touchTipDisabled'] },
    } as LabwareDefinition2
    expect(getIsTouchTipEnabled(sourceOrDestination)).toBe(false)
  })
  it('should return true if the source or destination is "source"', () => {
    const sourceOrDestination = 'source'
    expect(getIsTouchTipEnabled(sourceOrDestination)).toBe(true)
  })
})
