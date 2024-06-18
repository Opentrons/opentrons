import * as React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import {
  getLoadedLabwareDefinitionsByUri,
  getPositionFromSlotId,
  fixture96Plate,
  TEMPERATURE_MODULE_V2,
  getModuleDef2,
} from '@opentrons/shared-data'

import { mockPickUpTipLabware } from '../../__fixtures__'
import {
  getIsLabwareMatch,
  getSlotNameAndLwLocFrom,
  getRunCurrentLabwareInfo,
  getRunCurrentModulesInfo,
  getRunCurrentLabwareOnDeck,
  getRunCurrentModulesOnDeck,
} from '../useRecoveryMapUtils'
import { LabwareHighlight } from '../../shared'

import type { LabwareDefinition2 } from '@opentrons/shared-data'

vi.mock('@opentrons/shared-data', async importOriginal => {
  const actual = await importOriginal<typeof getLoadedLabwareDefinitionsByUri>()
  return {
    ...actual,
    getLoadedLabwareDefinitionsByUri: vi.fn(),
    getPositionFromSlotId: vi.fn(),
    getModuleDef2: vi.fn(),
  }
})

describe('getRunCurrentModulesOnDeck', () => {
  const mockLabwareDef: LabwareDefinition2 = {
    ...(fixture96Plate as LabwareDefinition2),
    metadata: {
      displayName: 'Mock Labware Definition',
      displayCategory: 'wellPlate',
      displayVolumeUnits: 'mL',
    },
  }
  const mockFailedLabwareUtils = {
    pickUpTipLabware: mockPickUpTipLabware,
  } as any
  const mockModuleDef = { model: 'MOCK_MODEL' } as any
  const mockCurrentModulesInfo = [
    {
      moduleId: 'MOCK_PickUpTipLabware_ID',
      moduleDef: mockModuleDef,
      slotName: 'A1',
      nestedLabwareDef: mockLabwareDef,
      nestedLabwareSlotName: 'MOCK_MODULE_ID',
    },
  ]

  beforeEach(() => {
    vi.mocked(getModuleDef2).mockReturnValue({ model: 'MOCK_MODEL' } as any)
  })

  it('should return an array of RunCurrentModulesOnDeck objects', () => {
    const mockPickUpTipLabwareSameSlot = {
      pickUpTipLabware: {
        ...mockPickUpTipLabware,
        location: { moduleId: 'MOCK_MODULE_ID' },
      },
    } as any

    const result = getRunCurrentModulesOnDeck({
      failedLabwareUtils: mockPickUpTipLabwareSameSlot,
      currentModulesInfo: mockCurrentModulesInfo,
    })

    expect(result).toEqual([
      {
        moduleModel: 'MOCK_MODEL',
        moduleLocation: { slotName: 'A1' },
        innerProps: {},
        nestedLabwareDef: mockLabwareDef,
        moduleChildren: (
          <LabwareHighlight highlight={true} definition={mockLabwareDef} />
        ),
      },
    ])
  })
  it('should set moduleChildren to null if getIsLabwareMatch returns false', () => {
    const result = getRunCurrentModulesOnDeck({
      failedLabwareUtils: mockFailedLabwareUtils,
      currentModulesInfo: [
        {
          ...mockCurrentModulesInfo[0],
          nestedLabwareSlotName: 'MOCK_MODULE_ID_2',
        },
      ],
    })

    expect(result[0].moduleChildren).toBeNull()
  })

  it('should set moduleChildren to null if nestedLabwareDef is null', () => {
    const result = getRunCurrentModulesOnDeck({
      failedLabwareUtils: mockFailedLabwareUtils,
      currentModulesInfo: [
        { ...mockCurrentModulesInfo[0], nestedLabwareDef: null },
      ],
    })

    expect(result[0].moduleChildren).toBeNull()
  })
})

describe('getRunCurrentLabwareOnDeck', () => {
  const mockLabwareDef: LabwareDefinition2 = {
    ...(fixture96Plate as LabwareDefinition2),
    metadata: {
      displayName: 'Mock Labware Definition',
      displayCategory: 'wellPlate',
      displayVolumeUnits: 'mL',
    },
  }

  const mockCurrentLabwareInfo = {
    labwareDef: mockLabwareDef,
    labwareLocation: { slotName: 'A1' },
    slotName: 'A1',
  }
  const mockFailedLabwareUtils = {
    pickUpTipLabware: { ...mockPickUpTipLabware, location: { slotName: 'A1' } },
  } as any

  it('should return a valid RunCurrentLabwareOnDeck with a labware highlight if the labware is the pickUpTipLabware', () => {
    const result = getRunCurrentLabwareOnDeck({
      currentLabwareInfo: [mockCurrentLabwareInfo],
      failedLabwareUtils: mockFailedLabwareUtils,
    })

    expect(result).toEqual([
      {
        labwareLocation: { slotName: 'A1' },
        definition: mockLabwareDef,
        labwareChildren: (
          <LabwareHighlight highlight={true} definition={mockLabwareDef} />
        ),
      },
    ])
  })

  it('should set labwareChildren to null if getIsLabwareMatch returns false', () => {
    const result = getRunCurrentLabwareOnDeck({
      failedLabwareUtils: {
        ...mockFailedLabwareUtils,
        pickUpTipLabware: {
          ...mockPickUpTipLabware,
          location: { slotName: 'B1' },
        },
      },
      currentLabwareInfo: [mockCurrentLabwareInfo],
    })

    expect(result[0].labwareChildren).toBeNull()
  })
})

describe('getRunCurrentModulesInfo', () => {
  const mockModule = {
    model: TEMPERATURE_MODULE_V2,
    id: 'MOCK_MODULE_ID',
    location: { slotName: 'A1' },
  }
  const mockRunRecord = {
    data: {
      modules: [mockModule],
      labware: [
        { ...mockPickUpTipLabware, location: { moduleId: 'MOCK_MODULE_ID' } },
      ],
    },
  } as any
  const mockDeckDef = {} as any
  const mockProtocolAnalysis = {} as any

  beforeEach(() => {
    vi.mocked(getLoadedLabwareDefinitionsByUri).mockReturnValue({
      'opentrons/opentrons_96_pcr_adapter/1': 'MOCK_LW_DEF',
    } as any)
    vi.mocked(getPositionFromSlotId).mockReturnValue('position' as any)
    vi.mocked(getModuleDef2).mockReturnValue('MOCK_MODULE_DEF' as any)
  })

  it('should return an empty array if runRecord is null', () => {
    const result = getRunCurrentModulesInfo({
      runRecord: null as any,
      deckDef: mockDeckDef,
      protocolAnalysis: mockProtocolAnalysis,
    })

    expect(result).toEqual([])
  })

  it('should return an empty array if protocolAnalysis is null', () => {
    const result = getRunCurrentModulesInfo({
      runRecord: mockRunRecord,
      deckDef: mockDeckDef,
      protocolAnalysis: null,
    })

    expect(result).toEqual([])
  })

  it('should return an array of RunCurrentModuleInfo objects for each module in runRecord.data.modules', () => {
    const result = getRunCurrentModulesInfo({
      runRecord: mockRunRecord,
      deckDef: mockDeckDef,
      protocolAnalysis: mockProtocolAnalysis,
    })

    expect(result).toEqual([
      {
        moduleId: mockModule.id,
        moduleDef: 'MOCK_MODULE_DEF',
        nestedLabwareDef: 'MOCK_LW_DEF',
        nestedLabwareSlotName: 'MOCK_MODULE_ID',
        slotName: mockModule.location.slotName,
      },
    ])
  })

  it('should set nestedLabwareDef to null if there is no nested labware on the module', () => {
    const result = getRunCurrentModulesInfo({
      runRecord: {
        ...mockRunRecord,
        data: { modules: [mockModule], labware: [] },
      },
      deckDef: mockDeckDef,
      protocolAnalysis: mockProtocolAnalysis,
    })
    expect(result).toEqual([
      {
        moduleId: mockModule.id,
        moduleDef: 'MOCK_MODULE_DEF',
        nestedLabwareDef: null,
        nestedLabwareSlotName: '',
        slotName: mockModule.location.slotName,
      },
    ])
  })

  it('should exclude modules if getPositionFromSlotId returns null', () => {
    vi.mocked(getPositionFromSlotId).mockReturnValueOnce(null)

    const result = getRunCurrentModulesInfo({
      runRecord: mockRunRecord,
      deckDef: mockDeckDef,
      protocolAnalysis: mockProtocolAnalysis,
    })
    expect(result).toEqual([])
  })
})

describe('getRunCurrentLabwareInfo', () => {
  const mockLabwareDef: LabwareDefinition2 = {
    ...(fixture96Plate as LabwareDefinition2),
    metadata: {
      displayName: 'Mock Labware Definition',
      displayCategory: 'wellPlate',
      displayVolumeUnits: 'mL',
    },
  }

  beforeEach(() => {
    vi.mocked(getLoadedLabwareDefinitionsByUri).mockReturnValue({
      'opentrons/opentrons_96_pcr_adapter/1': mockLabwareDef,
    })
  })

  it('should return an empty array if runRecord is null', () => {
    const result = getRunCurrentLabwareInfo({
      runRecord: undefined,
      protocolAnalysis: {} as any,
    })

    expect(result).toEqual([])
  })

  it('should return an empty array if protocolAnalysis is null', () => {
    const result = getRunCurrentLabwareInfo({
      runRecord: { data: { labware: [] } } as any,
      protocolAnalysis: null,
    })

    expect(result).toEqual([])
  })

  it('should return an array of RunCurrentLabwareInfo objects for each labware in runRecord.data.labware', () => {
    const mockPickUpTipLwSlotName = {
      ...mockPickUpTipLabware,
      location: { slotName: 'A1' },
    }

    const result = getRunCurrentLabwareInfo({
      runRecord: { data: { labware: [mockPickUpTipLwSlotName] } } as any,
      protocolAnalysis: { commands: [] } as any,
    })

    expect(result).toEqual([
      {
        labwareDef: mockLabwareDef,
        slotName: 'A1',
        labwareLocation: { slotName: 'A1' },
      },
    ])
  })
})

describe('getSlotNameAndLwLocFrom', () => {
  it('should return [null, null] if location is null', () => {
    const result = getSlotNameAndLwLocFrom(null, false)
    expect(result).toEqual([null, null])
  })

  it('should return [null, null] if location is "offDeck"', () => {
    const result = getSlotNameAndLwLocFrom('offDeck', false)
    expect(result).toEqual([null, null])
  })

  it('should return [null, null] if location has a moduleId and excludeModules is true', () => {
    const result = getSlotNameAndLwLocFrom({ moduleId: 'MOCK_MODULE_ID' }, true)
    expect(result).toEqual([null, null])
  })

  it('should return [moduleId, { moduleId }] if location has a moduleId and excludeModules is false', () => {
    const result = getSlotNameAndLwLocFrom(
      { moduleId: 'MOCK_MODULE_ID' },
      false
    )
    expect(result).toEqual(['MOCK_MODULE_ID', { moduleId: 'MOCK_MODULE_ID' }])
  })

  it('should return [labwareId, { labwareId }] if location has a labwareId', () => {
    const result = getSlotNameAndLwLocFrom({ labwareId: 'MOCK_LW_ID' }, false)
    expect(result).toEqual(['MOCK_LW_ID', { labwareId: 'MOCK_LW_ID' }])
  })

  it('should return [addressableAreaName, { addressableAreaName }] if location has an addressableAreaName', () => {
    const result = getSlotNameAndLwLocFrom({ addressableAreaName: 'A1' }, false)
    expect(result).toEqual(['A1', { addressableAreaName: 'A1' }])
  })

  it('should return [slotName, { slotName }] if location has a slotName', () => {
    const result = getSlotNameAndLwLocFrom({ slotName: 'A1' }, false)
    expect(result).toEqual(['A1', { slotName: 'A1' }])
  })

  it('should return [null, null] if location does not match any known location type', () => {
    const result = getSlotNameAndLwLocFrom(
      { unknownProperty: 'MOCK_VALUE' } as any,
      false
    )
    expect(result).toEqual([null, null])
  })
})

describe('getIsLabwareMatch', () => {
  it('should return false if pickUpTipLabware is null', () => {
    const result = getIsLabwareMatch('A1', null)
    expect(result).toBe(false)
  })

  it('should return false if pickUpTipLabware location is a string', () => {
    const result = getIsLabwareMatch('offdeck', { location: 'offdeck' } as any)
    expect(result).toBe(false)
  })

  it('should return false if pickUpTipLabware location has a moduleId', () => {
    const result = getIsLabwareMatch('A1', {
      location: { moduleId: 'MOCK_MODULE_ID' },
    } as any)
    expect(result).toBe(false)
  })

  it('should return true if pickUpTipLabware location slotName matches the provided slotName', () => {
    const result = getIsLabwareMatch('A1', {
      location: { slotName: 'A1' },
    } as any)
    expect(result).toBe(true)
  })

  it('should return false if pickUpTipLabware location slotName does not match the provided slotName', () => {
    const result = getIsLabwareMatch('A1', {
      location: { slotName: 'A2' },
    } as any)
    expect(result).toBe(false)
  })

  it('should return true if pickUpTipLabware location labwareId matches the provided slotName', () => {
    const result = getIsLabwareMatch('lwId', {
      location: { labwareId: 'lwId' },
    } as any)
    expect(result).toBe(true)
  })

  it('should return false if pickUpTipLabware location labwareId does not match the provided slotName', () => {
    const result = getIsLabwareMatch('lwId', {
      location: { labwareId: 'lwId2' },
    } as any)
    expect(result).toBe(false)
  })

  it('should return true if pickUpTipLabware location addressableAreaName matches the provided slotName', () => {
    const slotName = 'B1'
    const pickUpTipLabware = {
      location: { addressableAreaName: 'B1' },
    } as any
    const result = getIsLabwareMatch(slotName, pickUpTipLabware)
    expect(result).toBe(true)
  })

  it('should return false if pickUpTipLabware location addressableAreaName does not match the provided slotName', () => {
    const slotName = 'A1'
    const pickUpTipLabware = {
      location: { addressableAreaName: 'B2' },
    } as any
    const result = getIsLabwareMatch(slotName, pickUpTipLabware)
    expect(result).toBe(false)
  })

  it('should return false if pickUpTipLabware location does not match any known location type', () => {
    const slotName = 'A1'
    const pickUpTipLabware = {
      location: { unknownProperty: 'someValue' },
    } as any
    const result = getIsLabwareMatch(slotName, pickUpTipLabware)
    expect(result).toBe(false)
  })
})
