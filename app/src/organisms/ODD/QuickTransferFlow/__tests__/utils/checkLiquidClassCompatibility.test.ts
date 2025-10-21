import { describe, expect, it } from 'vitest'

import { checkLiquidClassCompatibility } from '../../utils'

const mockNotUsedLiquidClass = {
  byPipette: [],
  description: 'Default',
  displayName: "Don't use liquid class settings",
  liquidClassName: 'none',
  namespace: 'opentrons',
  schemaVersion: 1,
}

const mockLiquid = {
  displayName: 'A',
  liquidClassName: '',
  description: '',
  schemaVersion: 0,
  namespace: '',
  byPipette: [
    {
      pipetteModel: 'flex_1channel_50',
      byTipType: [
        {
          tiprack: 'opentrons/opentrons_flex_96_tiprack_50ul/1',
          aspirate: {},
          singleDispense: {
            submerge: {
              positionReference: 'well-top',
              offset: {
                x: 0,
                y: 0,
                z: 2,
              },
              speed: 100,
              delay: {
                enable: false,
                params: {
                  duration: 0,
                },
              },
            },
          },
          multiDispense: {},
        },
      ],
    },
  ],
} as any

const mockState = {
  pipette: {
    displayName: 'Flex 1-Channel 50 µL',
    model: 'p50',
    displayCategory: 'FLEX',
    channels: 1,
    liquids: {
      default: {
        $otSharedSchema:
          '#/pipette/schemas/2/pipetteLiquidPropertiesSchema.json',
        supportedTips: {},
        maxVolume: 50,
        minVolume: 5,
        defaultTipracks: [
          'opentrons/opentrons_flex_96_tiprack_50ul/1',
          'opentrons/opentrons_flex_96_filtertiprack_50ul/1',
        ],
      },
      lowVolumeDefault: {
        $otSharedSchema:
          '#/pipette/schemas/2/pipetteLiquidPropertiesSchema.json',
        supportedTips: {},
        maxVolume: 30,
        minVolume: 1,
        defaultTipracks: [
          'opentrons/opentrons_flex_96_tiprack_50ul/1',
          'opentrons/opentrons_flex_96_filtertiprack_50ul/1',
        ],
      },
    },
  } as any,
  mount: 'left',
  tipRack: {
    wells: {
      A1: {
        totalLiquidVolume: 200,
      },
    },
    parameters: {
      format: '96Standard',
      quirks: [],
      isTiprack: true,
      tipLength: 57.9,
      tipOverlap: 10.5,
      isMagneticModuleCompatible: false,
      loadName: 'opentrons_flex_96_tiprack_50ul',
    },
  } as any,
  source: {},
  sourceWells: ['A1'],
  destination: 'source',
  destinationWells: ['A1'],
  transferType: 'transfer',
  volume: 15,
  path: 'single',
  changeTip: 'once',
  dropTipLocation: {
    cutoutFixtureId: 'trashBinAdapter',
    cutoutId: 'cutoutA3',
  },
} as any

describe('checkLiquidClassCompatibility', () => {
  it('no liquid class should return inCompatible false', () => {
    const result = checkLiquidClassCompatibility(
      mockNotUsedLiquidClass,
      mockState
    )
    expect(result.incompatible).toBe(false)
  })

  it('liquid volume should be less than 10 incompatible', () => {
    const invalidState = { ...mockState, volume: 0 }
    const result = checkLiquidClassCompatibility(mockLiquid, invalidState)
    expect(result.incompatible).toBe(true)
    expect(result.volumeIncompatible).toBe(true)
  })

  it('mock liquid should return incompatible true pipette is undefined', () => {
    const invalidState = { ...mockState, pipette: undefined }
    const result = checkLiquidClassCompatibility(mockLiquid, invalidState)
    expect(result.incompatible).toBe(true)
  })

  it('mock liquid should return incompatible true tipRack is undefined', () => {
    const invalidState = { ...mockState, tipRack: undefined }
    const result = checkLiquidClassCompatibility(mockLiquid, invalidState)
    expect(result.incompatible).toBe(true)
  })

  it('mock liquid should return incompatible true path is undefined', () => {
    const invalidState = { ...mockState, path: undefined }
    const result = checkLiquidClassCompatibility(mockLiquid, invalidState)
    expect(result.incompatible).toBe(true)
  })

  it('mock liquid should return incompatible true volume is undefined', () => {
    const invalidState = { ...mockState, volume: undefined }
    const result = checkLiquidClassCompatibility(mockLiquid, invalidState)
    expect(result.incompatible).toBe(true)
  })

  it('mock liquid should return incompatible false', () => {
    const result = checkLiquidClassCompatibility(mockLiquid, mockState)
    expect(result.incompatible).toBe(false)
    expect(result.pipetteIncompatible).toBe(false)
    expect(result.tipRackIncompatible).toBe(false)
    expect(result.pipettePathIncompatible).toBe(false)
  })

  it('mock water should return incompatible true singleDispense is undefined', () => {
    const invalidLiquid = { ...mockLiquid, byPipette: [] }
    const result = checkLiquidClassCompatibility(invalidLiquid, mockState)
    expect(result.incompatible).toBe(true)
    expect(result.pipettePathIncompatible).toBe(true)
  })

  // TODO (kk:04/18/2025) add more test cases
})
