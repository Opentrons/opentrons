import { describe, expect, it } from 'vitest'

import { AIR } from '@opentrons/step-generation'

import { getLiquidIdsForStepSummary } from '../utils'

const MOCK_LABWARE_ID = 'mockLabwareId'

describe('getLiquidIdsForStepSummary', () => {
  it('should return empty array when no liquids present', () => {
    const liquidState = {
      labware: {
        [MOCK_LABWARE_ID]: {
          A1: {},
          A2: {},
        },
      },
    }
    const result = getLiquidIdsForStepSummary(
      liquidState as any,
      MOCK_LABWARE_ID,
      ['A1', 'A2']
    )
    expect(result).toEqual([])
  })

  it('should return unique liquid IDs with volume > 0', () => {
    const liquidState = {
      labware: {
        [MOCK_LABWARE_ID]: {
          A1: {
            liquid0: { volume: 10 },
            liquid1: { volume: 20 },
          },
          A2: {
            liquid0: { volume: 15 },
            liquid2: { volume: 25 },
          },
        },
      },
    }
    const result = getLiquidIdsForStepSummary(
      liquidState as any,
      MOCK_LABWARE_ID,
      ['A1', 'A2']
    )
    expect(result).toEqual(['liquid0', 'liquid1', 'liquid2'])
  })

  it('should exclude AIR liquid ID', () => {
    const liquidState = {
      labware: {
        [MOCK_LABWARE_ID]: {
          A1: {
            [AIR]: { volume: 10 },
            liquid0: { volume: 20 },
          },
        },
      },
    }
    const result = getLiquidIdsForStepSummary(
      liquidState as any,
      MOCK_LABWARE_ID,
      ['A1']
    )
    expect(result).toEqual(['liquid0'])
  })

  it('should exclude liquids with volume <= 0', () => {
    const liquidState = {
      labware: {
        [MOCK_LABWARE_ID]: {
          A1: {
            liquid0: { volume: 0 },
            liquid1: { volume: -5 },
            liquid2: { volume: 10 },
          },
        },
      },
    }
    const result = getLiquidIdsForStepSummary(
      liquidState as any,
      MOCK_LABWARE_ID,
      ['A1']
    )
    expect(result).toEqual(['liquid2'])
  })

  it('should handle multiple wells with different liquids', () => {
    const liquidState = {
      labware: {
        [MOCK_LABWARE_ID]: {
          A1: {
            liquid0: { volume: 10 },
            liquid1: { volume: 20 },
          },
          B1: {
            liquid2: { volume: 15 },
            liquid3: { volume: 25 },
          },
        },
      },
    }
    const result = getLiquidIdsForStepSummary(
      liquidState as any,
      MOCK_LABWARE_ID,
      ['A1', 'B1']
    )
    expect(result).toEqual(['liquid0', 'liquid1', 'liquid2', 'liquid3'])
  })
})
