import { describe, it, expect } from 'vitest'
import { generateCompatibleLabwareForPipette } from '../../utils'
import {
  SINGLE_CHANNEL_COMPATIBLE_LABWARE,
  EIGHT_CHANNEL_COMPATIBLE_LABWARE,
  NINETY_SIX_CHANNEL_COMPATIBLE_LABWARE,
} from '../../constants'

// if one of these fails, it is likely that a new definition has been added
// and you need to regenerate the lists stored at ../constants
describe('generateCompatibleLabwareForPipette', () => {
  it('generates the list for single channel pipettes', () => {
    const compatibleLabwareUris = generateCompatibleLabwareForPipette({
      channels: 1,
    } as any)
    expect(compatibleLabwareUris).toEqual(SINGLE_CHANNEL_COMPATIBLE_LABWARE)
  })
  it('generates the list for eight channel pipettes', () => {
    const compatibleLabwareUris = generateCompatibleLabwareForPipette({
      channels: 8,
    } as any)
    expect(compatibleLabwareUris).toEqual(EIGHT_CHANNEL_COMPATIBLE_LABWARE)
  })
  it('generates the list for 96 channel pipettes', () => {
    const compatibleLabwareUris = generateCompatibleLabwareForPipette({
      channels: 96,
    } as any)
    expect(compatibleLabwareUris).toEqual(NINETY_SIX_CHANNEL_COMPATIBLE_LABWARE)
  })
})
