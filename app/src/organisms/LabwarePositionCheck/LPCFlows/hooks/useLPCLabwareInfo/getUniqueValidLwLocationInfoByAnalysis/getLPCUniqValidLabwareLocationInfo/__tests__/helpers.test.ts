import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getAddressableAreaNameFrom,
  getClosestBeneathAdapterId,
  getClosestBeneathModuleId,
  getClosestBeneathModuleModel,
  getLabwareDefURIFrom,
  getLwModStackupDetails,
} from '../helpers'

import type { LabwareOffsetLocationSequence } from '@opentrons/api-client'
import type {
  LabwareLocationSequence,
  LoadedModule,
} from '@opentrons/shared-data'
import type { AnalysisLwURIsByLwId } from '../getAllPossibleLwURIsInRun'

describe('getClosestBeneathModuleId', () => {
  it('should return undefined when no module in sequence', () => {
    const locSeq: LabwareLocationSequence = [
      { kind: 'onAddressableArea', addressableAreaName: 'A1' },
    ]

    const result = getClosestBeneathModuleId(locSeq)

    expect(result).toBeUndefined()
  })

  it('should return the moduleId of the last module in sequence', () => {
    const locSeq: LabwareLocationSequence = [
      { kind: 'onAddressableArea', addressableAreaName: 'A1' },
      { kind: 'onModule', moduleId: 'module-1' },
      { kind: 'onModule', moduleId: 'module-2' },
    ]

    const result = getClosestBeneathModuleId(locSeq)

    expect(result).toBe('module-2')
  })

  it('should handle complex sequences and return the last module', () => {
    const locSeq: LabwareLocationSequence = [
      { kind: 'onAddressableArea', addressableAreaName: 'A1' },
      { kind: 'onModule', moduleId: 'module-1' },
      { kind: 'onLabware', labwareId: 'adapter-1', lidId: null },
      { kind: 'onModule', moduleId: 'module-2' },
      { kind: 'onLabware', labwareId: 'labware-1', lidId: null },
    ]

    const result = getClosestBeneathModuleId(locSeq)

    expect(result).toBe('module-2')
  })
})

describe('getClosestBeneathModuleModel', () => {
  const MOCK_MODULES: LoadedModule[] = [
    { id: 'module-1', model: 'thermocyclerModuleV2' },
    { id: 'module-2', model: 'magneticModuleV2' },
  ] as LoadedModule[]

  it('should return undefined when moduleId is undefined', () => {
    const result = getClosestBeneathModuleModel(undefined, MOCK_MODULES)

    expect(result).toBeUndefined()
  })

  it('should return undefined when module not found', () => {
    const result = getClosestBeneathModuleModel(
      'non-existent-module',
      MOCK_MODULES
    )

    expect(result).toBeUndefined()
  })

  it('should return the model for the given moduleId', () => {
    const result = getClosestBeneathModuleModel('module-1', MOCK_MODULES)

    expect(result).toBe('thermocyclerModuleV2')
  })
})

describe('getClosestBeneathAdapterId', () => {
  it('should return undefined when no labware in sequence', () => {
    const locSeq: LabwareLocationSequence = [
      { kind: 'onAddressableArea', addressableAreaName: 'A1' },
      { kind: 'onModule', moduleId: 'module-1' },
    ]

    const result = getClosestBeneathAdapterId(locSeq)

    expect(result).toBeUndefined()
  })

  it('should return the labwareId of the last labware in sequence', () => {
    const locSeq: LabwareLocationSequence = [
      { kind: 'onAddressableArea', addressableAreaName: 'A1' },
      { kind: 'onLabware', labwareId: 'adapter-1', lidId: null },
      { kind: 'onLabware', labwareId: 'adapter-2', lidId: null },
    ]

    const result = getClosestBeneathAdapterId(locSeq)

    expect(result).toBe('adapter-2')
  })

  it('should handle complex sequences and return the last labware', () => {
    const locSeq: LabwareLocationSequence = [
      { kind: 'onAddressableArea', addressableAreaName: 'A1' },
      { kind: 'onModule', moduleId: 'module-1' },
      { kind: 'onLabware', labwareId: 'adapter-1', lidId: null },
      { kind: 'onModule', moduleId: 'module-2' },
      { kind: 'onLabware', labwareId: 'adapter-2', lidId: null },
    ]

    const result = getClosestBeneathAdapterId(locSeq)

    expect(result).toBe('adapter-2')
  })
})

describe('getAddressableAreaNameFrom', () => {
  it('should return null when no addressable area in sequence', () => {
    const locSeq: LabwareLocationSequence = [
      { kind: 'onModule', moduleId: 'module-1' },
      { kind: 'onLabware', labwareId: 'adapter-1', lidId: null },
    ]

    const result = getAddressableAreaNameFrom(locSeq)

    expect(result).toBeNull()
  })

  it('should return the name of the last addressable area in sequence', () => {
    const locSeq: LabwareLocationSequence = [
      { kind: 'onAddressableArea', addressableAreaName: 'A1' },
      { kind: 'onAddressableArea', addressableAreaName: 'B1' },
    ]

    const result = getAddressableAreaNameFrom(locSeq)

    expect(result).toBe('B1')
  })

  it('should handle complex sequences and return the last addressable area', () => {
    const locSeq: LabwareLocationSequence = [
      { kind: 'onAddressableArea', addressableAreaName: 'A1' },
      { kind: 'onModule', moduleId: 'module-1' },
      { kind: 'onLabware', labwareId: 'adapter-1', lidId: null },
      { kind: 'onAddressableArea', addressableAreaName: 'B1' },
    ]

    const result = getAddressableAreaNameFrom(locSeq)

    expect(result).toBe('B1')
  })
})

describe('getLabwareDefURIFrom', () => {
  const MOCK_LW_URI_BY_ID: AnalysisLwURIsByLwId = {
    'labware-1': 'opentrons/labware-1',
    'labware-2': 'opentrons/labware-2',
  }

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('should return URI for the given labware ID', () => {
    const result = getLabwareDefURIFrom('labware-1', MOCK_LW_URI_BY_ID)

    expect(result).toBe('opentrons/labware-1')
  })

  it('should return empty string and log error when labware ID not found', () => {
    const result = getLabwareDefURIFrom(
      'non-existent-labware',
      MOCK_LW_URI_BY_ID
    )

    expect(result).toBe('')
    expect(console.error).toHaveBeenCalledWith(
      'Expected to find matching labware def for id: non-existent-labware'
    )
  })

  it('should return empty string and log error when URI is empty', () => {
    const mockLwUriByIdWithEmpty = {
      ...MOCK_LW_URI_BY_ID,
      'empty-uri-labware': '',
    }

    const result = getLabwareDefURIFrom(
      'empty-uri-labware',
      mockLwUriByIdWithEmpty
    )

    expect(result).toBe('')
    expect(console.error).toHaveBeenCalledWith(
      'Expected to find matching labware def for id: empty-uri-labware'
    )
  })
})

describe('getLwModStackupDetails', () => {
  const TOP_LW_ID = 'labware-top'
  const TOP_LW_URI = 'opentrons/labware-top'
  const ADAPTER_ID = 'adapter-1'
  const ADAPTER_URI = 'opentrons/adapter'
  const MODULE_ID = 'module-1'
  const MODULE_MODEL = 'thermocyclerModuleV2'

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('should return empty array when offset sequence and location sequence lengths do not match', () => {
    const offsetLocSeq: LabwareOffsetLocationSequence = [
      { kind: 'onAddressableArea', addressableAreaName: 'A1' },
      { kind: 'onModule', moduleModel: MODULE_MODEL },
    ]

    const locSeq: LabwareLocationSequence = [
      { kind: 'onAddressableArea', addressableAreaName: 'A1' },
    ]

    const result = getLwModStackupDetails(
      offsetLocSeq,
      locSeq,
      TOP_LW_ID,
      TOP_LW_URI
    )

    expect(result).toEqual([])
    expect(console.error).toHaveBeenCalled()
  })

  it('should correctly map location sequence to stackup details with only modules and labware', () => {
    const offsetLocSeq: LabwareOffsetLocationSequence = [
      { kind: 'onAddressableArea', addressableAreaName: 'A1' },
      { kind: 'onModule', moduleModel: MODULE_MODEL },
      { kind: 'onLabware', labwareUri: ADAPTER_URI },
    ]

    const locSeq: LabwareLocationSequence = [
      { kind: 'onAddressableArea', addressableAreaName: 'A1' },
      { kind: 'onModule', moduleId: MODULE_ID },
      { kind: 'onLabware', labwareId: ADAPTER_ID, lidId: null },
    ]

    const result = getLwModStackupDetails(
      offsetLocSeq,
      locSeq,
      TOP_LW_ID,
      TOP_LW_URI
    )

    expect(result).toHaveLength(3)

    expect(result).toContainEqual({
      kind: 'module',
      moduleModel: MODULE_MODEL,
      id: MODULE_ID,
    })

    expect(result).toContainEqual({
      kind: 'labware',
      labwareUri: ADAPTER_URI,
      id: ADAPTER_ID,
    })

    expect(result).toContainEqual({
      kind: 'labware',
      labwareUri: TOP_LW_URI,
      id: TOP_LW_ID,
    })

    expect(result[result.length - 1]).toEqual({
      kind: 'labware',
      labwareUri: TOP_LW_URI,
      id: TOP_LW_ID,
    })
  })

  it('should correctly handle complex sequences with multiple modules and labware', () => {
    const offsetLocSeq: LabwareOffsetLocationSequence = [
      { kind: 'onAddressableArea', addressableAreaName: 'A1' },
      { kind: 'onModule', moduleModel: 'magneticModuleV2' },
      { kind: 'onLabware', labwareUri: 'adapter-1' },
      { kind: 'onModule', moduleModel: 'thermocyclerModuleV2' },
      { kind: 'onLabware', labwareUri: 'adapter-2' },
    ]

    const locSeq: LabwareLocationSequence = [
      { kind: 'onAddressableArea', addressableAreaName: 'A1' },
      { kind: 'onModule', moduleId: 'module-1' },
      { kind: 'onLabware', labwareId: 'adapter-1', lidId: null },
      { kind: 'onModule', moduleId: 'module-2' },
      { kind: 'onLabware', labwareId: 'adapter-2', lidId: null },
    ]

    const result = getLwModStackupDetails(
      offsetLocSeq,
      locSeq,
      TOP_LW_ID,
      TOP_LW_URI
    )

    expect(result).toHaveLength(5)

    expect(result).toContainEqual({
      kind: 'module',
      moduleModel: 'magneticModuleV2',
      id: 'module-1',
    })

    expect(result).toContainEqual({
      kind: 'labware',
      labwareUri: 'adapter-1',
      id: 'adapter-1',
    })

    expect(result).toContainEqual({
      kind: 'module',
      moduleModel: 'thermocyclerModuleV2',
      id: 'module-2',
    })

    expect(result).toContainEqual({
      kind: 'labware',
      labwareUri: 'adapter-2',
      id: 'adapter-2',
    })

    expect(result).toContainEqual({
      kind: 'labware',
      labwareUri: TOP_LW_URI,
      id: TOP_LW_ID,
    })

    expect(result[result.length - 1]).toEqual({
      kind: 'labware',
      labwareUri: TOP_LW_URI,
      id: TOP_LW_ID,
    })
  })

  it('should filter out non-module and non-labware components', () => {
    const offsetLocSeq: LabwareOffsetLocationSequence = [
      { kind: 'onAddressableArea', addressableAreaName: 'A1' },
      { kind: 'onModule', moduleModel: MODULE_MODEL },
    ]

    const locSeq: LabwareLocationSequence = [
      { kind: 'onAddressableArea', addressableAreaName: 'A1' },
      { kind: 'onModule', moduleId: MODULE_ID },
    ]

    const result = getLwModStackupDetails(
      offsetLocSeq,
      locSeq,
      TOP_LW_ID,
      TOP_LW_URI
    )

    expect(result).toHaveLength(2)

    expect(result).toContainEqual({
      kind: 'module',
      moduleModel: MODULE_MODEL,
      id: MODULE_ID,
    })

    expect(result).toContainEqual({
      kind: 'labware',
      labwareUri: TOP_LW_URI,
      id: TOP_LW_ID,
    })

    expect(result[result.length - 1]).toEqual({
      kind: 'labware',
      labwareUri: TOP_LW_URI,
      id: TOP_LW_ID,
    })
  })
})
