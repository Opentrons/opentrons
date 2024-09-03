import { describe, it, expect } from 'vitest'
import { getVolumeRange } from '../../utils'

import type { QuickTransferWizardState } from '../../types'

describe('getVolumeRange', () => {
  const state: QuickTransferWizardState = {
    pipette: {
      channels: 1,
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
      metadata: {
        displayCategory: 'well_plate',
      },
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
      metadata: {
        displayCategory: 'well_plate',
      },
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
    const result = getVolumeRange(state)
    expect(result.min).toEqual(5)
    // should equal lesser of pipette max, tip capacity, volume of all selected wells
    expect(result.max).toEqual(200)
  })
  it('calculates the range for an n to 1 transfer', () => {
    const result = getVolumeRange({ ...state, sourceWells: ['A1', 'A2'] })
    expect(result.min).toEqual(5)
    // should equal lesser of pipette max, tip capacity, volume of all
    // selected source wells and 1 / 2 volume of destination well
    expect(result.max).toEqual(75)
  })
  it('calculates the range for an 1 to n transfer', () => {
    const result = getVolumeRange({ ...state, destinationWells: ['A1', 'A2'] })
    expect(result.min).toEqual(5)
    // should equal lesser of pipette max, tip capacity, volume of all
    // selected destination wells and 1 / 2 volume of source well
    expect(result.max).toEqual(100)
  })
  it('calculates the range for 1 to n transfer with same labware', () => {
    const result = getVolumeRange({
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
