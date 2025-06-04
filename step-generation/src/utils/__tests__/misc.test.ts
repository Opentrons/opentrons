import { describe, expect, it } from 'vitest'

import {
  fixtureTiprack10ul as _fixtureTiprack10ul,
  fixtureTiprack300ul as _fixtureTiprack300ul,
} from '@opentrons/shared-data'

import { getTransferPlanAndReferenceVolumes } from '../misc'

import type { LabwareDefinition2, PipetteV2Specs } from '@opentrons/shared-data'

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

describe('getTransferPlanAndReferenceVolumes', () => {
  it('should return correct values for single path', () => {
    const result = getTransferPlanAndReferenceVolumes({
      pipetteSpecs: MOCK_P10_SPECS,
      tiprackDefinition: fixtureTiprack10ul,
      volume: 5,
      path: 'single',
      numDispenseWells: 1,
      aspirateAirGapByVolume: [],
      conditioningByVolume: null,
      disposalByVolume: null,
    })
    expect(result).toEqual({
      referenceVolumes: {
        airGap: 5,
        correctionAspirate: 5,
        correctionDispense: 5,
        pushOut: 5,
        flowRateAspirate: 5,
        flowRateDispense: 5,
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
      numDispenseWells: 1,
      aspirateAirGapByVolume: [],
      conditioningByVolume: null,
      disposalByVolume: null,
    })
    expect(result.referenceVolumes.airGap).toBeCloseTo(7.5)
    expect(result.referenceVolumes.correctionAspirate).toBeCloseTo(7.5)
    expect(result.referenceVolumes.correctionDispense).toBeCloseTo(7.5)
    expect(result.referenceVolumes.pushOut).toBeCloseTo(7.5)
    expect(result.referenceVolumes.flowRateAspirate).toBeCloseTo(7.5)
    expect(result.referenceVolumes.flowRateDispense).toBeCloseTo(7.5)
    expect(result.multiWellHandling.isSupported).toBe(false)
  })

  it('should handle volumes exceeding tiprack max volume for single path', () => {
    const result = getTransferPlanAndReferenceVolumes({
      pipetteSpecs: MOCK_P300_SPECS,
      tiprackDefinition: fixtureTiprack10ul,
      volume: 15,
      path: 'single',
      numDispenseWells: 1,
      aspirateAirGapByVolume: [],
      conditioningByVolume: null,
      disposalByVolume: null,
    })
    expect(result.referenceVolumes.airGap).toBeCloseTo(7.5)
    expect(result.referenceVolumes.correctionAspirate).toBeCloseTo(7.5)
    expect(result.referenceVolumes.correctionDispense).toBeCloseTo(7.5)
    expect(result.referenceVolumes.pushOut).toBeCloseTo(7.5)
    expect(result.referenceVolumes.flowRateAspirate).toBeCloseTo(7.5)
    expect(result.referenceVolumes.flowRateDispense).toBeCloseTo(7.5)
    expect(result.multiWellHandling.isSupported).toBe(false)
  })

  it('should handle volumes exceeding tiprack max volume for single path with air gap', () => {
    const result = getTransferPlanAndReferenceVolumes({
      pipetteSpecs: MOCK_P300_SPECS,
      tiprackDefinition: fixtureTiprack10ul,
      volume: 10,
      path: 'single',
      numDispenseWells: 1,
      aspirateAirGapByVolume: [[10, 2]],
      conditioningByVolume: null,
      disposalByVolume: null,
    })
    expect(result.referenceVolumes.airGap).toBeCloseTo(5)
    expect(result.referenceVolumes.correctionAspirate).toBeCloseTo(5)
    expect(result.referenceVolumes.correctionDispense).toBeCloseTo(5)
    expect(result.referenceVolumes.pushOut).toBeCloseTo(5)
    expect(result.referenceVolumes.flowRateAspirate).toBeCloseTo(5)
    expect(result.referenceVolumes.flowRateDispense).toBeCloseTo(5)
    expect(result.multiWellHandling.isSupported).toBe(false)
  })

  it('should return correct values for multiAspirate path', () => {
    const result = getTransferPlanAndReferenceVolumes({
      pipetteSpecs: MOCK_P10_SPECS,
      tiprackDefinition: fixtureTiprack10ul,
      volume: 3,
      path: 'multiAspirate',
      numDispenseWells: 1,
      aspirateAirGapByVolume: [],
      conditioningByVolume: null,
      disposalByVolume: null,
    })
    expect(result).toEqual({
      referenceVolumes: {
        airGap: 9,
        correctionAspirate: 9,
        correctionDispense: 9,
        pushOut: 9,
        flowRateAspirate: 3,
        flowRateDispense: 9,
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
      aspirateAirGapByVolume: [],
      conditioningByVolume: null,
      disposalByVolume: null,
    })
    expect(result.referenceVolumes.airGap).toBe(8)
    expect(result.multiWellHandling.numWellsToFitInTip).toBe(2)
  })

  it('should limit multiAspirate by tiprack max volume', () => {
    const result = getTransferPlanAndReferenceVolumes({
      pipetteSpecs: MOCK_P300_SPECS,
      tiprackDefinition: fixtureTiprack10ul,
      volume: 4,
      path: 'multiAspirate',
      numDispenseWells: 1,
      aspirateAirGapByVolume: [],
      conditioningByVolume: null,
      disposalByVolume: null,
    })
    expect(result.referenceVolumes.airGap).toBe(8)
    expect(result.multiWellHandling.numWellsToFitInTip).toBe(2)
  })

  it('should return correct values for multiDispense path', () => {
    const result = getTransferPlanAndReferenceVolumes({
      pipetteSpecs: MOCK_P300_SPECS,
      tiprackDefinition: fixtureTiprack300ul,
      volume: 10,
      path: 'multiDispense',
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
    expect(result.referenceVolumes.airGap).toBe(30 + 3)
    expect(result.referenceVolumes.correctionAspirate).toBe(30 + 7.5 + 3)
    expect(result.referenceVolumes.correctionDispense).toBe(10)
    expect(result.referenceVolumes.pushOut).toBe(10)
    expect(result.referenceVolumes.conditioning).toBe(30)
    expect(result.referenceVolumes.disposal).toBe(30)
    expect(result.referenceVolumes.flowRateAspirate).toBe(30 + 7.5 + 3)
    expect(result.referenceVolumes.flowRateDispense).toBe(10)
    expect(result.multiWellHandling.isSupported).toBe(true)
    expect(result.multiWellHandling.numWellsToFitInTip).toBe(3)
  })

  it('should limit multiDispense by pipette max volume', () => {
    const result = getTransferPlanAndReferenceVolumes({
      pipetteSpecs: MOCK_P10_SPECS,
      tiprackDefinition: fixtureTiprack10ul,
      volume: 3,
      path: 'multiDispense',
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
    expect(result.referenceVolumes.airGap).toBe(6 + 2)
    expect(result.referenceVolumes.correctionAspirate).toBe(6 + 1 + 2)
    expect(result.referenceVolumes.correctionDispense).toBe(3)
    expect(result.referenceVolumes.pushOut).toBe(3)
    expect(result.referenceVolumes.conditioning).toBe(6)
    expect(result.referenceVolumes.disposal).toBe(6)
    expect(result.referenceVolumes.flowRateAspirate).toBe(6 + 1 + 2)
    expect(result.referenceVolumes.flowRateDispense).toBe(3)
    expect(result.multiWellHandling.isSupported).toBe(true)
    expect(result.multiWellHandling.numWellsToFitInTip).toBe(2)
  })

  it('should limit multiDispense by tiprack max volume', () => {
    const result = getTransferPlanAndReferenceVolumes({
      pipetteSpecs: MOCK_P300_SPECS,
      tiprackDefinition: fixtureTiprack10ul,
      volume: 3,
      path: 'multiDispense',
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
    expect(result.referenceVolumes.airGap).toBe(6 + 2)
    expect(result.referenceVolumes.correctionAspirate).toBe(6 + 1 + 2)
    expect(result.referenceVolumes.correctionDispense).toBe(3)
    expect(result.referenceVolumes.pushOut).toBe(3)
    expect(result.referenceVolumes.conditioning).toBe(6)
    expect(result.referenceVolumes.disposal).toBe(6)
    expect(result.referenceVolumes.flowRateAspirate).toBe(6 + 1 + 2)
    expect(result.referenceVolumes.flowRateDispense).toBe(3)
    expect(result.multiWellHandling.isSupported).toBe(true)
    expect(result.multiWellHandling.numWellsToFitInTip).toBe(2)
  })

  it('should return isSupported false for multiDispense if not enough volume', () => {
    const result = getTransferPlanAndReferenceVolumes({
      pipetteSpecs: MOCK_P10_SPECS,
      tiprackDefinition: fixtureTiprack10ul,
      volume: 6,
      path: 'multiDispense',
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
      numDispenseWells: 1,
      aspirateAirGapByVolume: [],
      conditioningByVolume: null,
      disposalByVolume: null,
    })
    expect(result.referenceVolumes.airGap).toBe(1)
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
      numDispenseWells: 1,
      aspirateAirGapByVolume: [],
      conditioningByVolume: null,
      disposalByVolume: null,
    })
    expect(result.referenceVolumes.airGap).toBe(0.8)
  })
})
