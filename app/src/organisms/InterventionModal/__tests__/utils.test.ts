import deepClone from 'lodash/cloneDeep'

import { getSlotHasMatingSurfaceUnitVector } from '@opentrons/shared-data'
import deckDefFixture from '@opentrons/shared-data/deck/fixtures/3/deckExample.json'

import {
  mockLabwareDefinitions,
  mockLabwareOnSlot,
  mockModule,
  mockRunData,
  mockThermocyclerModule,
} from '../__fixtures__'
import {
  getCurrentRunLabwareRenderInfo,
  getCurrentRunModulesRenderInfo,
  getLabwareDisplayLocationFromRunData,
  getLabwareNameFromRunData,
  getModuleDisplayLocationFromRunData,
  getModuleModelFromRunData,
} from '../utils'

jest.mock('@opentrons/shared-data', () => {
  const actualHelpers = jest.requireActual('@opentrons/shared-data')
  return {
    ...actualHelpers,
    getSlotHasMatingSurfaceUnitVector: jest.fn(),
  }
})

const mockGetSlotHasMatingSurfaceUnitVector = getSlotHasMatingSurfaceUnitVector as jest.MockedFunction<
  typeof getSlotHasMatingSurfaceUnitVector
>

describe('getLabwareDisplayLocationFromRunData', () => {
  const mockTranslator = jest.fn()

  it('uses off_deck copy when labware location is off deck', () => {
    getLabwareDisplayLocationFromRunData(
      mockRunData,
      'offDeck',
      mockTranslator,
      'OT-2 Standard'
    )
    expect(mockTranslator).toHaveBeenLastCalledWith('off_deck')
  })

  it('uses slot copy and slot name when labware location is a slot', () => {
    getLabwareDisplayLocationFromRunData(
      mockRunData,
      {
        slotName: '3',
      },
      mockTranslator,
      'OT-2 Standard'
    )
    expect(mockTranslator).toHaveBeenLastCalledWith('slot', { slot_name: '3' })
  })

  it('returns an empty string if the location is a module that cannot be found in protocol data', () => {
    const res = getLabwareDisplayLocationFromRunData(
      mockRunData,
      { moduleId: 'badID' },
      mockTranslator,
      'OT-2 Standard'
    )

    expect(res).toEqual('')
  })

  it('uses module in slot copy when location is a module in the protocol data', () => {
    getLabwareDisplayLocationFromRunData(
      mockRunData,
      { moduleId: 'mockModuleID' },
      mockTranslator,
      'OT-2 Standard'
    )

    expect(mockTranslator).toHaveBeenLastCalledWith('module_in_slot', {
      count: 1,
      module: 'Heater-Shaker Module GEN1',
      slot_name: '3',
    })
  })
})

describe('getLabwareNameFromRunData', () => {
  it('returns an empty string if it cannot find matching loaded labware', () => {
    const res = getLabwareNameFromRunData(mockRunData, 'a bad ID', [])
    expect(res).toEqual('')
  })

  it('returns "Fixed Trash" if the given labware is the trash', () => {
    const mockRunDataWithTrash = deepClone(mockRunData)
    mockRunDataWithTrash.labware.push({
      id: 'mockTrashID',
      loadName: 'trash',
      definitionUri: 'opentrons/opentrons_1_trash_1100ml_fixed/1',
      location: {
        slotName: '12',
      },
    })

    const res = getLabwareNameFromRunData(
      mockRunDataWithTrash,
      'mockTrashID',
      []
    )
    expect(res).toEqual('Fixed Trash')
  })

  it('returns the display name of loaded labware if present', () => {
    const displayName = 'mock display name'
    const mockRunDataWithLoadedDisplayName = deepClone(mockRunData)
    mockRunDataWithLoadedDisplayName.labware[0].displayName = displayName

    const res = getLabwareNameFromRunData(
      mockRunDataWithLoadedDisplayName,
      'mockLabwareID',
      []
    )
    expect(res).toEqual(displayName)
  })

  it('returns display name from labware definition when not present on loaded labware', () => {
    const definitionDisplayName = 'Definition Display Name'
    const res = getLabwareNameFromRunData(mockRunData, 'mockLabwareID', [
      {
        commandType: 'loadLabware',
        result: {
          definition: {
            namespace: 'opentrons',
            parameters: { loadName: 'nest_96_wellplate_100ul_pcr_full_skirt' },
            version: '1',
            metadata: {
              displayName: definitionDisplayName,
            },
          },
        },
      },
    ] as any)

    expect(res).toEqual(definitionDisplayName)
  })
})

describe('getModuleDisplayLocationFromRunData', () => {
  it('returns the location of a given loaded module ID', () => {
    const res = getModuleDisplayLocationFromRunData(mockRunData, 'mockModuleID')

    expect(res).toEqual('3')
  })

  it('returns an empty string of the module ID cannot be found in loaded modules', () => {
    const res = getModuleDisplayLocationFromRunData(
      mockRunData,
      'mockBadModuleID'
    )

    expect(res).toEqual('')
  })
})

describe('getModuleModelFromRunData', () => {
  it('returns the module model of a given loaded module ID', () => {
    const res = getModuleModelFromRunData(mockRunData, 'mockModuleID')

    expect(res).toEqual('heaterShakerModuleV1')
  })

  it('returns the null if a given module ID cannot be found in loaded modules', () => {
    const res = getModuleModelFromRunData(mockRunData, 'mockBadModuleID')

    expect(res).toEqual(null)
  })
})

describe('getCurrentRunLabwareRenderInfo', () => {
  beforeEach(() => {
    mockGetSlotHasMatingSurfaceUnitVector.mockReturnValue(true)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('returns an empty array if there is no loaded labware for the run', () => {
    const res = getCurrentRunLabwareRenderInfo(
      { labware: [] } as any,
      {},
      {} as any
    )

    expect(res).toBeInstanceOf(Array)
    expect(res).toHaveLength(0)
  })

  it('returns run labware render info', () => {
    const res = getCurrentRunLabwareRenderInfo(
      mockRunData,
      mockLabwareDefinitions,
      deckDefFixture as any
    )
    const labwareInfo = res[0]
    expect(labwareInfo).toBeTruthy()
    expect(labwareInfo.x).toEqual(0) // taken from deckDef fixture
    expect(labwareInfo.y).toEqual(0)
    expect(labwareInfo.labwareDef.metadata.displayName).toEqual(
      'mock labware display name'
    )
    expect(labwareInfo.labwareId).toEqual('mockLabwareID2')
  })

  it('does not add labware to results array if the labwares slot does not have a mating surface vector', () => {
    mockGetSlotHasMatingSurfaceUnitVector.mockReturnValue(false)
    const res = getCurrentRunLabwareRenderInfo(
      mockRunData,
      mockLabwareDefinitions,
      deckDefFixture as any
    )
    expect(res).toHaveLength(0)
  })

  it('defaults labware x, y coordinates to 0,0 if slot position not found in deck definition', () => {
    const mockBadSlotLabware = {
      id: 'mockBadLabwareID',
      loadName: 'nest_96_wellplate_100ul_pcr_full_skirt',
      definitionUri: 'opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1',
      location: {
        slotName: '0',
      },
    }
    const res = getCurrentRunLabwareRenderInfo(
      { labware: [mockBadSlotLabware] } as any,
      mockLabwareDefinitions,
      deckDefFixture as any
    )

    expect(res[0].x).toEqual(0)
    expect(res[0].y).toEqual(0)
  })
})

describe('getCurrentRunModuleRenderInfo', () => {
  it('returns an empty array if there is no loaded module for the run', () => {
    const res = getCurrentRunModulesRenderInfo(
      { modules: [] } as any,
      {} as any,
      {}
    )
    expect(res).toBeInstanceOf(Array)
    expect(res).toHaveLength(0)
  })

  it('returns run module render info with nested labware', () => {
    const res = getCurrentRunModulesRenderInfo(
      mockRunData,
      deckDefFixture as any,
      mockLabwareDefinitions
    )
    const moduleInfo = res[0]
    expect(moduleInfo).toBeTruthy()
    expect(moduleInfo.x).toEqual(265.0) // taken from the deckDef fixture
    expect(moduleInfo.y).toEqual(0)
    expect(moduleInfo.moduleDef.moduleType).toEqual('heaterShakerModuleType')
    expect(moduleInfo.moduleId).toEqual('mockModuleID')
    expect(moduleInfo.nestedLabwareDef).not.toEqual(null)
    expect(moduleInfo.nestedLabwareId).toEqual('mockLabwareID')
  })

  it('returns run module render info without nested labware', () => {
    const mockRunDataNoNesting = {
      labware: [mockLabwareOnSlot],
      modules: [mockModule],
    } as any

    const res = getCurrentRunModulesRenderInfo(
      mockRunDataNoNesting,
      deckDefFixture as any,
      mockLabwareDefinitions
    )

    const moduleInfo = res[0]
    expect(moduleInfo.nestedLabwareDef).toEqual(null)
    expect(moduleInfo.nestedLabwareId).toEqual(null)
  })

  it('returns the correct x,y coords for a thermocycler that spans slots 7, 8, 10, and 11', () => {
    const mockRunDataWithTC = {
      labware: [],
      modules: [mockThermocyclerModule],
    } as any

    const res = getCurrentRunModulesRenderInfo(
      mockRunDataWithTC,
      deckDefFixture as any,
      mockLabwareDefinitions
    )

    expect(res[0].x).toEqual(0)
    expect(res[0].y).toEqual(181.0)
  })

  it('defaults module x,y coordinates to 0,0 if slot position not found in deck definition', () => {
    const mockRunDataWithBadModuleSlot = {
      labware: [],
      modules: [
        {
          id: 'mockModuleID',
          model: 'heaterShakerModuleV1',
          location: {
            slotName: '0',
          },
          serialNumber: 'dummySerialHS',
        },
      ],
    } as any

    const res = getCurrentRunModulesRenderInfo(
      mockRunDataWithBadModuleSlot,
      deckDefFixture as any,
      mockLabwareDefinitions
    )

    expect(res[0].x).toEqual(0)
    expect(res[0].y).toEqual(0)
  })
})
