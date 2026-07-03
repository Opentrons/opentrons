import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  fixtureTiprack10ul as _fixtureTiprack10ul,
  fixtureTiprack300ul as _fixtureTiprack300ul,
  FLEX_STACKER_A4_ADDRESSABLE_AREA,
  FLEX_STACKER_MODULE_TYPE,
  getMmFromBottom,
  POSITION_REFERENCE_TOP,
} from '@opentrons/shared-data'

import {
  deckSlotKeyForFlexStackerShuttleAddressableArea,
  getFlexStackerShuttleAddressableArea,
  getFullStackFromLabwares,
  getIsRetractSafeForAirGap,
  getTransferPlanAndReferenceVolumes,
  resolveDeckSlotKeyForLabwareStackInSlot,
} from '../misc'

import type { LabwareDefinition2, PipetteV2Specs } from '@opentrons/shared-data'
import type { ModuleEntities, RobotState } from '../../types'

vi.mock('@opentrons/shared-data', async () => {
  const actual = await vi.importActual('@opentrons/shared-data')
  return {
    ...actual,
    getMmFromBottom: vi.fn(),
  }
})

const fixtureTiprack10ul = _fixtureTiprack10ul as LabwareDefinition2
const fixtureTiprack300ul = _fixtureTiprack300ul as LabwareDefinition2
const MOCK_P10_SPECS: PipetteV2Specs = {
  channels: 1,
  defaultTipracks: [],
  displayCategory: 'GEN2',
  id: 'p10_single_gen2',
  model: 'p10_single',
  name: 'p10 Single GEN2',
  nominalMaxVolumeUl: 10,
  supportedTips: [],
  tipLength: 50,
  liquids: {
    default: {
      maxVolume: 10,
      minVolume: 1,
    },
  },
} as any

const MOCK_P300_SPECS: PipetteV2Specs = {
  channels: 8,
  defaultTipracks: [],
  displayCategory: 'GEN2',
  id: 'p300_multi_gen2',
  model: 'p300_multi',
  name: 'p300 Multi GEN2',
  nominalMaxVolumeUl: 300,
  supportedTips: [],
  tipLength: 50,
  liquids: {
    default: {
      maxVolume: 300,
      minVolume: 10,
    },
  },
} as any

const MOCK_LABWARE_ID = 'mockLabwareId'
const MOCK_LABWARE_ENTITIES = {
  [MOCK_LABWARE_ID]: {
    def: {
      wells: {
        A1: {
          depth: 10,
        },
      },
    },
  },
}

describe('getTransferPlanAndReferenceVolumes', () => {
  it('should return correct values for single path', () => {
    const result = getTransferPlanAndReferenceVolumes({
      pipetteSpecs: MOCK_P10_SPECS,
      tiprackDefinition: fixtureTiprack10ul,
      volume: 5,
      path: 'single',
      numAspirateWells: 1,
      numDispenseWells: 1,
      aspirateAirGapByVolume: [],
      conditioningByVolume: null,
      disposalByVolume: null,
    })
    expect(result).toEqual({
      referenceVolumes: {
        airGap: {
          aspirate: 5,
          dispense: 0,
        },
        correction: {
          aspirate: 5,
          dispense: 5,
        },
        flowRate: {
          aspirate: 5,
          dispense: 5,
        },
        pushOut: 5,
      },
      multiWellHandling: {
        isSupported: false,
      },
    })
  })

  it('should handle volumes exceeding pipette max volume for single path', () => {
    const result = getTransferPlanAndReferenceVolumes({
      pipetteSpecs: MOCK_P10_SPECS,
      tiprackDefinition: fixtureTiprack10ul,
      volume: 15,
      path: 'single',
      numAspirateWells: 1,
      numDispenseWells: 1,
      aspirateAirGapByVolume: [],
      conditioningByVolume: null,
      disposalByVolume: null,
    })
    expect(result.referenceVolumes.airGap.aspirate).toBeCloseTo(7.5)
    expect(result.referenceVolumes.correction.aspirate).toBeCloseTo(7.5)
    expect(result.referenceVolumes.correction.dispense).toBeCloseTo(7.5)
    expect(result.referenceVolumes.flowRate.aspirate).toBeCloseTo(7.5)
    expect(result.referenceVolumes.flowRate.dispense).toBeCloseTo(7.5)
    expect(result.multiWellHandling.isSupported).toBe(false)
  })

  it('should handle volumes exceeding tiprack max volume for single path', () => {
    const result = getTransferPlanAndReferenceVolumes({
      pipetteSpecs: MOCK_P300_SPECS,
      tiprackDefinition: fixtureTiprack10ul,
      volume: 15,
      path: 'single',
      numAspirateWells: 1,
      numDispenseWells: 1,
      aspirateAirGapByVolume: [],
      conditioningByVolume: null,
      disposalByVolume: null,
    })
    expect(result.referenceVolumes.airGap.aspirate).toBeCloseTo(7.5)
    expect(result.referenceVolumes.correction.aspirate).toBeCloseTo(7.5)
    expect(result.referenceVolumes.correction.dispense).toBeCloseTo(7.5)
    expect(result.referenceVolumes.flowRate.aspirate).toBeCloseTo(7.5)
    expect(result.referenceVolumes.flowRate.dispense).toBeCloseTo(7.5)
    expect(result.multiWellHandling.isSupported).toBe(false)
  })

  it('should handle volumes exceeding tiprack max volume for single path with air gap', () => {
    const result = getTransferPlanAndReferenceVolumes({
      pipetteSpecs: MOCK_P300_SPECS,
      tiprackDefinition: fixtureTiprack10ul,
      volume: 10,
      path: 'single',
      numAspirateWells: 1,
      numDispenseWells: 1,
      aspirateAirGapByVolume: [[10, 2]],
      conditioningByVolume: null,
      disposalByVolume: null,
    })
    expect(result.referenceVolumes.airGap.aspirate).toBeCloseTo(5)
    expect(result.referenceVolumes.correction.aspirate).toBeCloseTo(5)
    expect(result.referenceVolumes.correction.dispense).toBeCloseTo(5)
    expect(result.referenceVolumes.flowRate.aspirate).toBeCloseTo(5)
    expect(result.referenceVolumes.flowRate.dispense).toBeCloseTo(5)
    expect(result.multiWellHandling.isSupported).toBe(false)
  })

  it('should return correct values for multiAspirate path', () => {
    const result = getTransferPlanAndReferenceVolumes({
      pipetteSpecs: MOCK_P10_SPECS,
      tiprackDefinition: fixtureTiprack10ul,
      volume: 3,
      path: 'multiAspirate',
      numAspirateWells: 3,
      numDispenseWells: 1,
      aspirateAirGapByVolume: [],
      conditioningByVolume: null,
      disposalByVolume: null,
    })
    expect(result).toEqual({
      referenceVolumes: {
        airGap: {
          aspirate: 9,
          dispense: 0,
        },
        correction: {
          aspirate: 9,
          dispense: 9,
        },
        flowRate: {
          aspirate: 3,
          dispense: 9,
        },
        pushOut: 9,
      },
      multiWellHandling: {
        isSupported: true,
        numWellsToFitInTip: 3,
      },
    })
  })

  it('should limit multiAspirate by pipette max volume', () => {
    const result = getTransferPlanAndReferenceVolumes({
      pipetteSpecs: MOCK_P10_SPECS,
      tiprackDefinition: fixtureTiprack10ul,
      volume: 4,
      path: 'multiAspirate',
      numDispenseWells: 1,
      numAspirateWells: 3,
      aspirateAirGapByVolume: [],
      conditioningByVolume: null,
      disposalByVolume: null,
    })
    expect(result.referenceVolumes.airGap.aspirate).toBe(8)
    expect(result.multiWellHandling.numWellsToFitInTip).toBe(2)
  })

  it('should limit multiAspirate by tiprack max volume', () => {
    const result = getTransferPlanAndReferenceVolumes({
      pipetteSpecs: MOCK_P300_SPECS,
      tiprackDefinition: fixtureTiprack10ul,
      volume: 4,
      path: 'multiAspirate',
      numDispenseWells: 1,
      numAspirateWells: 3,
      aspirateAirGapByVolume: [],
      conditioningByVolume: null,
      disposalByVolume: null,
    })
    expect(result.referenceVolumes.airGap.aspirate).toBe(8)
    expect(result.multiWellHandling.numWellsToFitInTip).toBe(2)
  })

  it('should return correct values for multiDispense path', () => {
    const result = getTransferPlanAndReferenceVolumes({
      pipetteSpecs: MOCK_P300_SPECS,
      tiprackDefinition: fixtureTiprack300ul,
      volume: 10,
      path: 'multiDispense',
      numAspirateWells: 1,
      numDispenseWells: 3,
      aspirateAirGapByVolume: [],
      conditioningByVolume: [
        [20, 5],
        [40, 10],
      ],
      disposalByVolume: [
        [20, 2],
        [40, 4],
      ],
    })
    expect(result.referenceVolumes.airGap.aspirate).toBe(30 + 3)
    expect(result.referenceVolumes.airGap.dispense).toBe(20 + 2)
    expect(result.referenceVolumes.correction.aspirate).toBe(30 + 7.5 + 3)
    expect(result.referenceVolumes.correction.dispense).toBe(10)
    expect(result.referenceVolumes.pushOut).toBe(10)
    expect(result.referenceVolumes.conditioning).toBe(30)
    expect(result.referenceVolumes.disposal).toBe(30)
    expect(result.referenceVolumes.flowRate.aspirate).toBe(30 + 7.5 + 3)
    expect(result.referenceVolumes.flowRate.dispense).toBe(10)
    expect(result.multiWellHandling.isSupported).toBe(true)
    expect(result.multiWellHandling.numWellsToFitInTip).toBe(3)
  })

  it('should limit multiDispense by pipette max volume', () => {
    const result = getTransferPlanAndReferenceVolumes({
      pipetteSpecs: MOCK_P10_SPECS,
      tiprackDefinition: fixtureTiprack10ul,
      volume: 3,
      path: 'multiDispense',
      numAspirateWells: 1,
      numDispenseWells: 4,
      aspirateAirGapByVolume: [],
      conditioningByVolume: [
        [5, 0],
        [7, 2],
      ],
      disposalByVolume: [
        [5, 1],
        [7, 3],
      ],
    })
    expect(result.referenceVolumes.airGap.aspirate).toBe(6 + 2)
    expect(result.referenceVolumes.airGap.dispense).toBe(3 + 1)
    expect(result.referenceVolumes.correction.aspirate).toBe(6 + 1 + 2)
    expect(result.referenceVolumes.correction.dispense).toBe(3)
    expect(result.referenceVolumes.pushOut).toBe(3)
    expect(result.referenceVolumes.conditioning).toBe(6)
    expect(result.referenceVolumes.disposal).toBe(6)
    expect(result.referenceVolumes.flowRate.aspirate).toBe(6 + 1 + 2)
    expect(result.multiWellHandling.isSupported).toBe(true)
    expect(result.multiWellHandling.numWellsToFitInTip).toBe(2)
  })

  it('should limit multiDispense by tiprack max volume', () => {
    const result = getTransferPlanAndReferenceVolumes({
      pipetteSpecs: MOCK_P300_SPECS,
      tiprackDefinition: fixtureTiprack10ul,
      volume: 3,
      path: 'multiDispense',
      numAspirateWells: 1,
      numDispenseWells: 4,
      aspirateAirGapByVolume: [],
      conditioningByVolume: [
        [5, 0],
        [7, 2],
      ],
      disposalByVolume: [
        [5, 1],
        [7, 3],
      ],
    })
    expect(result.referenceVolumes.airGap.aspirate).toBe(6 + 2)
    expect(result.referenceVolumes.airGap.dispense).toBe(3 + 1)
    expect(result.referenceVolumes.correction.aspirate).toBe(6 + 1 + 2)
    expect(result.referenceVolumes.correction.dispense).toBe(3)
    expect(result.referenceVolumes.pushOut).toBe(3)
    expect(result.referenceVolumes.conditioning).toBe(6)
    expect(result.referenceVolumes.disposal).toBe(6)
    expect(result.referenceVolumes.flowRate.aspirate).toBe(6 + 1 + 2)
    expect(result.multiWellHandling.isSupported).toBe(true)
    expect(result.multiWellHandling.numWellsToFitInTip).toBe(2)
  })

  it('should return isSupported false for multiDispense if not enough volume', () => {
    const result = getTransferPlanAndReferenceVolumes({
      pipetteSpecs: MOCK_P10_SPECS,
      tiprackDefinition: { ...fixtureTiprack10ul, namespace: 'opentrons' },
      volume: 6,
      path: 'multiDispense',
      numAspirateWells: 1,
      numDispenseWells: 2,
      aspirateAirGapByVolume: [],
      conditioningByVolume: [[10, 1]],
      disposalByVolume: [[10, 0.5]],
    })
    expect(result.multiWellHandling.isSupported).toBe(false)
  })

  it('should handle low volume mode for single path', () => {
    const mockLowVolumePipetteSpecs: PipetteV2Specs = {
      ...MOCK_P10_SPECS,
      liquids: {
        default: {
          maxVolume: 10,
          minVolume: 2,
        },
        lowVolumeDefault: {
          maxVolume: 2,
          minVolume: 0.5,
        },
      },
    } as any
    const result = getTransferPlanAndReferenceVolumes({
      pipetteSpecs: mockLowVolumePipetteSpecs,
      tiprackDefinition: fixtureTiprack10ul,
      volume: 1,
      path: 'single',
      numAspirateWells: 1,
      numDispenseWells: 1,
      aspirateAirGapByVolume: [],
      conditioningByVolume: null,
      disposalByVolume: null,
    })
    expect(result.referenceVolumes.airGap.aspirate).toBe(1)
  })

  it('should use default liquids if lowVolumeDefault is not defined', () => {
    const mockNoLowVolumePipetteSpecs: PipetteV2Specs = {
      ...MOCK_P10_SPECS,
      liquids: {
        default: {
          maxVolume: 10,
          minVolume: 1,
        },
      },
    } as any
    const result = getTransferPlanAndReferenceVolumes({
      pipetteSpecs: mockNoLowVolumePipetteSpecs,
      tiprackDefinition: fixtureTiprack10ul,
      volume: 0.8,
      path: 'single',
      numAspirateWells: 1,
      numDispenseWells: 1,
      aspirateAirGapByVolume: [],
      conditioningByVolume: null,
      disposalByVolume: null,
    })
    expect(result.referenceVolumes.airGap.aspirate).toBe(0.8)
  })
})

describe('getIsRetractSafeForAirGap', () => {
  let args: any
  beforeEach(() => {
    args = {
      retractZOffset: 0,
      retractPositionReference: POSITION_REFERENCE_TOP,
      labwareEntities: MOCK_LABWARE_ENTITIES,
      labwareId: 'mockLabwareId',
      well: 'A1',
    }
  })

  it('should return false if well is null (trash entity)', () => {
    const result = getIsRetractSafeForAirGap({ ...args, well: null })
    expect(result).toBe(false)
  })

  it('should return false if well depth is null', () => {
    const result = getIsRetractSafeForAirGap({
      ...args,
      well: 'B1',
    })
    expect(result).toBe(false)
  })

  it('should return true if retract mm from bottom === safe move to well offset from top', () => {
    vi.mocked(getMmFromBottom).mockReturnValue(12)
    const result = getIsRetractSafeForAirGap(args)
    expect(result).toBe(true)
  })

  it('should return true if retract mm from bottom > safe move to well offset from top', () => {
    vi.mocked(getMmFromBottom).mockReturnValue(13)
    const result = getIsRetractSafeForAirGap(args)
    expect(result).toBe(true)
  })

  it('should return false if retract mm from bottom < safe move to well offset from top', () => {
    vi.mocked(getMmFromBottom).mockReturnValue(11)
    const result = getIsRetractSafeForAirGap(args)
    expect(result).toBe(false)
  })
})

describe('getFullStackFromLabwares', () => {
  it('return the top stack of labwares', () => {
    const labware = {
      labwareId1: {
        stack: ['labwareId1', 'D3'],
      },
      labwareId2: {
        stack: ['labwareId2', 'labwareId1', 'D3'],
      },
    }
    const slot = 'D3'
    const largestStack = getFullStackFromLabwares(labware, slot, undefined)
    expect(largestStack).toEqual(['labwareId2', 'labwareId1', 'D3'])
  })

  it('return empty array if no labwares in slot', () => {
    const labware = {
      labwareId1: {
        stack: [],
      },
      labwareId2: {
        stack: [],
      },
    }
    const slot = 'D3'
    const largestStack = getFullStackFromLabwares(labware, slot, undefined)
    expect(largestStack).toEqual([])
  })
})

describe('flex stacker deck slot helpers', () => {
  it('resolveDeckSlotKeyForLabwareStackInSlot maps staging A4 to A3 when a stacker uses the cutout', () => {
    const modules = {
      stackerMod: {
        slot: 'A3',
        moduleState: { type: FLEX_STACKER_MODULE_TYPE },
      },
    } as unknown as RobotState['modules']
    const moduleEntities = {
      stackerMod: { type: FLEX_STACKER_MODULE_TYPE },
    } as unknown as ModuleEntities
    expect(
      resolveDeckSlotKeyForLabwareStackInSlot('A4', modules, moduleEntities)
    ).toBe('A3')
  })

  it('resolveDeckSlotKeyForLabwareStackInSlot leaves A4 when no stacker occupies the cutout', () => {
    expect(resolveDeckSlotKeyForLabwareStackInSlot('A4', {}, {})).toBe('A4')
  })

  it('deckSlotKeyForFlexStackerShuttleAddressableArea maps shuttle AA to the module deck slot id', () => {
    expect(
      deckSlotKeyForFlexStackerShuttleAddressableArea(
        FLEX_STACKER_A4_ADDRESSABLE_AREA
      )
    ).toBe('A3')
  })

  it('getFlexStackerShuttleAddressableArea returns the shuttle AA for a stacker module slot', () => {
    expect(getFlexStackerShuttleAddressableArea('A3')).toBe(
      FLEX_STACKER_A4_ADDRESSABLE_AREA
    )
  })
})
