import deepClone from 'lodash/cloneDeep'

import { mockRunData } from '../__fixtures__'
import {
  getLabwareDisplayLocationFromRunData,
  getLabwareNameFromRunData,
  getModuleDisplayLocationFromRunData,
  getModuleModelFromRunData,
} from '../utils'

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
