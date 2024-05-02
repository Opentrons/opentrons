import { describe, it, expect } from 'vitest'
import { getVolumeLimits, generateCompatibleLabwareForPipette } from '../utils'
import {
  SINGLE_CHANNEL_COMPATIBLE_LABWARE,
  EIGHT_CHANNEL_COMPATIBLE_LABWARE,
  NINETY_SIX_CHANNEL_COMPATIBLE_LABWARE,
} from '../constants'

import type { QuickTransferSetupState } from '../types'

describe('getVolumeLimits', () => {
  let state: QuickTransferSetupState = {
    pipette: {
      liquids: [
        {
          maxVolume: 1000,
          minVolume: 5,
        },
      ] as any,
    } as any,
    tipRack: {
      wells: {
        A1: {
          totalLiquidVolume: 200,
        },
      } as any,
    } as any,
    source: {
      wells: {
        A1: {
          totalLiquidVolume: 200,
        },
        A2: {
          totalLiquidVolume: 75,
        },
        A3: {
          totalLiquidVolume: 100,
        },
      } as any,
    } as any,
    sourceWells: ['A1'],
    destination: {
      wells: {
        A1: {
          totalLiquidVolume: 1000,
        },
        A2: {
          totalLiquidVolume: 1000,
        },
      } as any,
    } as any,
    destinationWells: ['A1'],
  }
  it('calculates the range for a 1 to 1 transfer', () => {
    const result = getVolumeLimits(state)
    expect(result.min).toEqual(5)
    // should equal lesser of pipette max, tip capacity, volume of all selected wells
    expect(result.max).toEqual(200)
  })
  it('calculates the range for an n to 1 transfer', () => {
    const result = getVolumeLimits({ ...state, sourceWells: ['A1', 'A2'] })
    expect(result.min).toEqual(5)
    // should equal lesser of pipette max, tip capacity, volume of all
    // selected source wells and 1 / 2 volume of destination well
    expect(result.max).toEqual(75)
  })
  it('calculates the range for an 1 to n transfer', () => {
    const result = getVolumeLimits({ ...state, destinationWells: ['A1', 'A2'] })
    expect(result.min).toEqual(5)
    // should equal lesser of pipette max, tip capacity, volume of all
    // selected destination wells and 1 / 2 volume of source well
    expect(result.max).toEqual(100)
  })
  it('calculates the range for 1 to n transfer with same labware', () => {
    const result = getVolumeLimits({
      ...state,
      destination: 'source',
      destinationWells: ['A2', 'A3'],
    })
    expect(result.min).toEqual(5)
    // should equal lesser of pipette max, tip capacity, volume of all
    // selected destination wells and 1 / 2 volume of source well
    expect(result.max).toEqual(75)
  })
})

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
