// tests for pipette info accessors in `shared-data/js/pipettes.js`
import { describe, expect, it } from 'vitest'
import {
  getPipetteSpecsV2,
  getPipetteNameSpecs,
  getPipetteModelSpecs,
  getMaxFlowRateByVolume,
} from '../pipettes'
import type { PipetteV2LiquidSpecs, PipetteV2Specs } from '../types'

const PIPETTE_NAMES = [
  'p10_single',
  'p50_single',
  'p300_single',
  'p1000_single',
  'p10_multi',
  'p50_multi',
  'p300_multi',
] as const

const PIPETTE_MODELS = [
  'p10_single_v1',
  'p10_single_v1.3',
  'p10_single_v1.4',
  'p10_single_v1.5',
  'p10_multi_v1',
  'p10_multi_v1.3',
  'p10_multi_v1.4',
  'p10_multi_v1.5',
  'p50_single_v1',
  'p50_single_v1.3',
  'p50_single_v1.4',
  'p50_multi_v1',
  'p50_multi_v1.3',
  'p50_multi_v1.4',
  'p50_multi_v1.5',
  'p300_single_v1',
  'p300_single_v1.3',
  'p300_single_v1.4',
  'p300_single_v1.5',
  'p300_multi_v1',
  'p300_multi_v1.3',
  'p300_multi_v1.4',
  'p300_multi_v1.5',
  'p1000_single_v1',
  'p1000_single_v1.3',
  'p1000_single_v1.4',
  'p1000_single_v1.5',
] as const

describe('pipette data accessors', () => {
  describe('getPipetteNameSpecs', () => {
    PIPETTE_NAMES.forEach(name =>
      it(`name ${name} snapshot`, () =>
        expect(getPipetteNameSpecs(name)).toMatchSnapshot())
    )
  })

  describe('getPipetteModelSpecs', () => {
    PIPETTE_MODELS.forEach(model =>
      it(`model ${model} snapshot`, () =>
        expect(getPipetteModelSpecs(model)).toMatchSnapshot())
    )
  })

  describe('getPipetteSpecsV2', () => {
    it('returns the correct info for p1000_single_flex', () => {
      const mockP1000Specs = {
        $otSharedSchema: '#/pipette/schemas/2/pipetteGeometrySchema.json',
        availableSensors: {
          sensors: ['pressure', 'capacitive', 'environment'],
          capacitive: { count: 1 },
          environment: { count: 1 },
          pressure: { count: 1 },
        },
        backCompatNames: [],
        backlashDistance: 0.1,
        channels: 1,
        displayCategory: 'FLEX',
        displayName: 'Flex 1-Channel 1000 μL',
        dropTipConfigurations: { plungerEject: { current: 1, speed: 10 } },
        liquids: {
          default: {
            $otSharedSchema:
              '#/pipette/schemas/2/pipetteLiquidPropertiesSchema.json',
            defaultTipOverlapDictionary: {
              default: 10.5,
              'opentrons/opentrons_flex_96_tiprack_1000ul/1': 10.5,
              'opentrons/opentrons_flex_96_tiprack_200ul/1': 10.5,
              'opentrons/opentrons_flex_96_tiprack_50ul/1': 10.5,
              'opentrons/opentrons_flex_96_filtertiprack_1000ul/1': 10.5,
              'opentrons/opentrons_flex_96_filtertiprack_200ul/1': 10.5,
              'opentrons/opentrons_flex_96_filtertiprack_50ul/1': 10.5,
            },
            defaultTipracks: [
              'opentrons/opentrons_flex_96_tiprack_1000ul/1',
              'opentrons/opentrons_flex_96_tiprack_200ul/1',
              'opentrons/opentrons_flex_96_tiprack_50ul/1',
              'opentrons/opentrons_flex_96_filtertiprack_1000ul/1',
              'opentrons/opentrons_flex_96_filtertiprack_200ul/1',
              'opentrons/opentrons_flex_96_filtertiprack_50ul/1',
            ],
            minVolume: 5,
            maxVolume: 1000,
            supportedTips: expect.anything(),
          },
        },
        model: 'p1000',
        nozzleMap: expect.anything(),
        pathTo3D:
          'pipette/definitions/2/geometry/single_channel/p1000/placeholder.gltf',
        pickUpTipConfigurations: {
          pressFit: {
            speedByTipCount: expect.anything(),
            presses: 1,
            increment: 0,
            distanceByTipCount: expect.anything(),
            currentByTipCount: expect.anything(),
          },
        },
        partialTipConfigurations: {
          availableConfigurations: null,
          partialTipSupported: false,
        },
        plungerHomingConfigurations: { current: 1, speed: 30 },
        plungerMotorConfigurations: { idle: 0.3, run: 1 },
        plungerPositionsConfigurations: {
          default: { blowout: 76.5, bottom: 71.5, drop: 90.5, top: 0.5 },
        },
        quirks: [],
        shaftDiameter: 4.5,
        shaftULperMM: 15.904,
        nozzleOffset: [-8, -22, -259.15],
        orderedColumns: expect.anything(),
        orderedRows: expect.anything(),
        pipetteBoundingBoxOffsets: {
          backLeftCorner: [-8, -22, -259.15],
          frontRightCorner: [-8, -22, -259.15],
        },
      } as PipetteV2Specs
      expect(getPipetteSpecsV2('p1000_single_flex')).toStrictEqual(
        mockP1000Specs
      )
    })
  })
  it('returns the correct liquid info for a p50 pipette with default and lowVolume', () => {
    const tiprack50uL = 'opentrons/opentrons_flex_96_tiprack_50ul/1'
    const tiprackFilter50uL = 'opentrons/opentrons_flex_96_filtertiprack_50ul/1'

    const mockLiquidDefault = {
      $otSharedSchema: '#/pipette/schemas/2/pipetteLiquidPropertiesSchema.json',
      defaultTipOverlapDictionary: {
        default: 10.5,
        [tiprackFilter50uL]: 10.5,
        [tiprack50uL]: 10.5,
      },
      defaultTipracks: [tiprack50uL, tiprackFilter50uL],
      maxVolume: 50,
      minVolume: 5,
      supportedTips: {
        t50: {
          maxFlowRate: {
            '5': 48,
            '6': 48.7,
            '7': 49.3,
            '8': 49.7,
            '9': 50,
            '10': 50.3,
            '11': 50.5,
            '12': 50.7,
            '13': 50.8,
            '14': 50.9,
            '15': 51,
            '16': 51.1,
            '17': 51.1,
            '18': 51.2,
            '19': 51.2,
            '20': 51.3,
            '21': 51.3,
            '22': 51.4,
            '23': 51.4,
            '24': 51.5,
            '25': 51.6,
            '26': 51.6,
            '27': 51.7,
            '28': 51.7,
            '29': 51.7,
            '30': 51.7,
            '31': 51.7,
            '32': 51.7,
            '33': 51.8,
            '34': 51.8,
            '35': 51.8,
            '36': 51.8,
            '37': 51.8,
            '38': 51.8,
            '39': 51.8,
            '40': 51.9,
            '41': 51.9,
            '42': 51.9,
            '43': 51.9,
            '44': 51.9,
            '45': 51.9,
            '46': 51.9,
            '47': 52,
            '48': 52,
            '49': 52,
            '50': 52,
          },
          aspirate: {
            default: {
              1: expect.anything(),
            },
          },
          defaultAspirateFlowRate: {
            default: 35,
            valuesByApiLevel: {
              '2.14': 35,
            },
          },
          defaultBlowOutFlowRate: {
            default: 57,
            valuesByApiLevel: {
              '2.14': 57,
            },
          },
          defaultDispenseFlowRate: {
            default: 57,
            valuesByApiLevel: {
              '2.14': 57,
            },
          },
          defaultFlowAcceleration: 1200,
          defaultPushOutVolume: 2,
          defaultReturnTipHeight: 0.71,
          defaultTipLength: 57.9,
          dispense: {
            default: {
              1: expect.anything(),
            },
          },
        },
      },
    } as PipetteV2LiquidSpecs
    const mockLiquidLowVolume = {
      $otSharedSchema: '#/pipette/schemas/2/pipetteLiquidPropertiesSchema.json',
      defaultTipOverlapDictionary: {
        default: 10.5,
        [tiprackFilter50uL]: 10.5,
        [tiprack50uL]: 10.5,
      },
      defaultTipracks: [tiprack50uL, tiprackFilter50uL],
      maxVolume: 30,
      minVolume: 1,
      supportedTips: {
        t50: {
          maxFlowRate: {
            '1': 32.8,
            '2': 41.5,
            '3': 42.6,
            '4': 45.5,
            '5': 48,
            '6': 48.7,
            '7': 49.3,
            '8': 49.7,
            '9': 50,
            '10': 50.3,
            '11': 50.5,
            '12': 50.7,
            '13': 50.8,
            '14': 50.9,
            '15': 51,
            '16': 51.1,
            '17': 51.1,
            '18': 51.2,
            '19': 51.2,
            '20': 51.3,
            '21': 51.3,
            '22': 51.4,
            '23': 51.4,
            '24': 51.5,
            '25': 51.6,
            '26': 51.6,
            '27': 51.7,
            '28': 51.7,
            '29': 51.7,
            '30': 51.7,
          },
          aspirate: {
            default: {
              1: expect.anything(),
            },
          },
          defaultAspirateFlowRate: {
            default: 35,
            valuesByApiLevel: {
              2.14: 35,
            },
          },
          defaultBlowOutFlowRate: {
            default: 57,
            valuesByApiLevel: {
              2.14: 57,
            },
          },
          defaultDispenseFlowRate: {
            default: 57,
            valuesByApiLevel: {
              2.14: 57,
            },
          },
          defaultFlowAcceleration: 1200,
          defaultPushOutVolume: 7,
          defaultReturnTipHeight: 0.71,
          defaultTipLength: 57.9,
          dispense: {
            default: {
              1: expect.anything(),
            },
          },
        },
      },
    } as PipetteV2LiquidSpecs
    const mockLiquids: Record<string, PipetteV2LiquidSpecs> = {
      default: mockLiquidDefault,
      lowVolumeDefault: mockLiquidLowVolume,
    }
    expect(getPipetteSpecsV2('p50_single_v3.5')?.liquids).toStrictEqual(
      mockLiquids
    )
  })

  describe('getMaxFlowRateByVolume', () => {
    const mockMaxFlowRate: Record<string, number> = {
      '6': 48.4,
      '7': 48.9,
      '8': 49.3,
      '9': 49.6,
      '10': 49.9,
      '11': 50.1,
      '12': 50.2,
      '13': 50.4,
      '14': 50.5,
      '15': 50.7,
      '16': 50.8,
      '17': 51,
      '18': 51,
      '19': 51.1,
      '20': 51.2,
      '21': 51.3,
      '22': 51.3,
      '23': 51.4,
      '24': 51.4,
      '25': 51.5,
      '26': 51.5,
      '27': 51.6,
      '28': 51.6,
      '29': 51.7,
      '30': 51.7,
      '31': 51.8,
      '32': 51.8,
      '33': 51.8,
      '34': 52,
      '35': 52,
      '36': 52,
      '37': 52.1,
      '38': 52.1,
      '39': 52.1,
      '40': 52.1,
      '41': 52.2,
      '42': 52.2,
      '43': 52.1,
      '44': 52.1,
      '45': 52.1,
      '46': 52.1,
      '47': 52.2,
      '48': 52.2,
      '49': 52.2,
      '50': 52.2,
    }

    for (let i = 1; i <= 50; i++) {
      it(`renders a max flow rate for ${i}uL for p50_single_v3.3 aspirate`, () => {
        const volume = i.toString()
        expect(getMaxFlowRateByVolume(mockMaxFlowRate, i)).toEqual(
          mockMaxFlowRate[volume]
        )
      })
    }
    it('returns undefined if max flow rate is undefined', () => {
      expect(getMaxFlowRateByVolume(undefined, 5)).toEqual(undefined)
    })
    it('returns undefined if volume is 0', () => {
      expect(getMaxFlowRateByVolume({} as any, undefined)).toEqual(undefined)
    })
    it('returns undefined if volume is out of range', () => {
      expect(getMaxFlowRateByVolume(mockMaxFlowRate, 55)).toEqual(undefined)
    })
  })
})
