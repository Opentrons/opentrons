// tests for pipette info accessors in `shared-data/js/pipettes.js`
import { describe, expect, it } from 'vitest'
import {
  getPipetteSpecsV2,
  getPipetteNameSpecs,
  getPipetteModelSpecs,
  getMaxFlowRateByVolume,
} from '../pipettes'
import type {
  PipetteV2LiquidSpecs,
  PipetteV2Specs,
  SupportedTip,
} from '../types'

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
    const P50_SINGLE_FLEX_MAX_FLOW_RATES = [
      28.9,
      38.7,
      42,
      44.8,
      47.8,
      48.6,
      49,
      49.5,
      49.8,
      50,
      50.2,
      50.5,
      50.7,
      50.8,
      50.9,
      51,
      51.1,
      51.3,
      51.3,
      51.4,
      51.4,
      51.5,
      51.5,
      51.6,
      51.7,
      51.7,
      51.7,
      51.7,
      51.8,
      51.7,
      51.7,
      51.8,
      51.8,
      51.8,
      51.9,
      51.9,
      51.9,
      51.9,
      52.1,
      52.1,
      52.1,
      52.2,
      52.2,
      52.2,
      52.1,
      52.1,
      52.1,
      52,
      52,
      52,
    ]

    const mockSupportedTip: SupportedTip = {
      defaultAspirateFlowRate: {
        default: 8,
        valuesByApiLevel: { '2.14': 8 },
      },
      defaultDispenseFlowRate: {
        default: 8,
        valuesByApiLevel: { '2.14': 8 },
      },
      defaultBlowOutFlowRate: {
        default: 4,
        valuesByApiLevel: { '2.14': 4 },
      },
      defaultFlowAcceleration: 1200.0,
      defaultTipLength: 57.9,
      defaultReturnTipHeight: 0.71,
      aspirate: {
        default: {
          '1': [
            [0.6464, 0.4817, 0.0427],
            [1.0889, 0.2539, 0.1591],
            [1.5136, 0.1624, 0.2587],
            [1.9108, 0.1042, 0.3467],
            [2.2941, 0.0719, 0.4085],
            [2.9978, 0.037, 0.4886],
            [3.7731, 0.0378, 0.4863],
            [4.7575, 0.0516, 0.4342],
            [5.5024, 0.011, 0.6275],
            [6.2686, 0.0114, 0.6253],
            [7.005, 0.0054, 0.6625],
            [8.5207, 0.0063, 0.6563],
            [10.0034, 0.003, 0.6844],
            [11.5075, 0.0031, 0.6833],
            [13.0327, 0.0032, 0.6829],
            [14.5356, 0.0018, 0.7003],
            [17.5447, 0.0014, 0.7063],
            [20.5576, 0.0011, 0.7126],
            [23.5624, 0.0007, 0.7197],
            [26.5785, 0.0007, 0.721],
            [29.593, 0.0005, 0.7248],
            [32.6109, 0.0004, 0.7268],
            [35.6384, 0.0004, 0.727],
            [38.6439, 0.0002, 0.7343],
            [41.6815, 0.0004, 0.7284],
            [44.6895, 0.0002, 0.7372],
            [47.6926, 0.0001, 0.7393],
            [51.4567, 0.0001, 0.7382],
          ],
        },
      },
      dispense: {
        default: {
          '1': [
            [0.6464, 0.4817, 0.0427],
            [1.0889, 0.2539, 0.1591],
            [1.5136, 0.1624, 0.2587],
            [1.9108, 0.1042, 0.3467],
            [2.2941, 0.0719, 0.4085],
            [2.9978, 0.037, 0.4886],
            [3.7731, 0.0378, 0.4863],
            [4.7575, 0.0516, 0.4342],
            [5.5024, 0.011, 0.6275],
            [6.2686, 0.0114, 0.6253],
            [7.005, 0.0054, 0.6625],
            [8.5207, 0.0063, 0.6563],
            [10.0034, 0.003, 0.6844],
            [11.5075, 0.0031, 0.6833],
            [13.0327, 0.0032, 0.6829],
            [14.5356, 0.0018, 0.7003],
            [17.5447, 0.0014, 0.7063],
            [20.5576, 0.0011, 0.7126],
            [23.5624, 0.0007, 0.7197],
            [26.5785, 0.0007, 0.721],
            [29.593, 0.0005, 0.7248],
            [32.6109, 0.0004, 0.7268],
            [35.6384, 0.0004, 0.727],
            [38.6439, 0.0002, 0.7343],
            [41.6815, 0.0004, 0.7284],
            [44.6895, 0.0002, 0.7372],
            [47.6926, 0.0001, 0.7393],
            [51.4567, 0.0001, 0.7382],
          ],
        },
      },
      defaultPushOutVolume: 2,
    }

    for (let i = 1; i <= 50; i++) {
      it(`renders a max flow rate for ${i}uL for p50_single_v3.3 aspirate`, () => {
        expect(
          getMaxFlowRateByVolume(mockSupportedTip, i, 'p50_single_v3.3')
        ).toEqual(P50_SINGLE_FLEX_MAX_FLOW_RATES[i - 1])
      })
    }
    it('returns 0 if supported tip specs is undefined', () => {
      expect(getMaxFlowRateByVolume(undefined, 5, 'p1000_multi_flex')).toEqual(
        0
      )
    })
    it('returns 0 if volume is 0', () => {
      expect(getMaxFlowRateByVolume({} as any, 0, 'p1000_multi_flex')).toEqual(
        0
      )
    })
  })
})
