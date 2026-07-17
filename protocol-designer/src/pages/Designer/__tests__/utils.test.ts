import { describe, expect, it } from 'vitest'

import {
  fixture96Plate,
  fixtureTiprackAdapter,
  HEATERSHAKER_MODULE_TYPE,
  HEATERSHAKER_MODULE_V1,
  TEMPERATURE_MODULE_TYPE,
  TEMPERATURE_MODULE_V1,
  WASTE_CHUTE_CUTOUT,
} from '@opentrons/shared-data'

import {
  _sortLabwareDropdownOptions,
  formatTime,
  getSlotInformation,
  getUnoccupiedStackOptions,
} from '../utils'

import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type {
  AdditionalEquipmentName,
  RobotState,
} from '@opentrons/step-generation'
import type { AllTemporalPropertiesForTimelineFrame } from '../../../step-forms'

const mockLabOnDeck1 = {
  stack: ['labId', 'mockHsId', '1'],
  id: 'labId',
  labwareDefURI: 'mockUri',
  def: fixtureTiprackAdapter as LabwareDefinition2,
  pythonName: 'mockPythonName',
}
const mockLabOnDeck2 = {
  stack: ['labId2', 'labId', 'mockHsId', '1'],
  id: 'labId2',
  labwareDefURI: 'mockUri2',
  def: fixture96Plate as LabwareDefinition2,
  pythonName: 'mockPythonName',
}
const mockLabOnDeck3 = {
  stack: ['labId3', '2'],
  id: 'labId3',
  labwareDefURI: 'mockUri3',
  def: fixtureTiprackAdapter as LabwareDefinition2,
  pythonName: 'mockPythonName',
}
const mockHS = {
  id: 'mockHsId',
  model: HEATERSHAKER_MODULE_V1,
  type: HEATERSHAKER_MODULE_TYPE,
  slot: '1',
  moduleState: {} as any,
  pythonName: 'mockPythonName',
}

const mockOt2DeckSetup: AllTemporalPropertiesForTimelineFrame = {
  labware: {
    labId: mockLabOnDeck1,
    labId2: mockLabOnDeck2,
    labId3: mockLabOnDeck3,
  },
  pipettes: {},
  modules: {
    hs: mockHS,
    temp: {
      id: 'mockTempId',
      model: TEMPERATURE_MODULE_V1,
      type: TEMPERATURE_MODULE_TYPE,
      slot: '3',
      moduleState: {} as any,
      pythonName: 'mockPythonName',
    },
  },
  additionalEquipmentOnDeck: {
    trash: { name: 'trashBin', id: 'mockTrashId', location: '12' },
  },
}

const mockLabOnStagingArea = {
  stack: ['labId3', 'D4'],
  id: 'labId3',
  labwareDefURI: 'mockUri3',
  def: fixture96Plate as LabwareDefinition2,
  pythonName: 'mockPythonName',
}
const mockHSFlex = {
  id: 'mockHsId',
  model: HEATERSHAKER_MODULE_V1,
  type: HEATERSHAKER_MODULE_TYPE,
  slot: 'D1',
  moduleState: {} as any,
  pythonName: 'mockPythonName',
}
const mockTrash = {
  name: 'trashBin' as AdditionalEquipmentName,
  id: 'mockTrashId',
  location: 'cutoutA3',
}
const mockWasteChute = {
  name: 'wasteChute' as AdditionalEquipmentName,
  id: 'mockWasteChuteId',
  location: WASTE_CHUTE_CUTOUT,
}
const mockStagingArea = {
  name: 'stagingArea' as AdditionalEquipmentName,
  id: 'mockStagingAreaId',
  location: WASTE_CHUTE_CUTOUT,
}
const mockLabOnDeck1Flex = {
  stack: ['labId', 'mockHsId', 'D1'],
  id: 'labId',
  labwareDefURI: 'mockUri',
  def: fixtureTiprackAdapter as LabwareDefinition2,
  pythonName: 'mockPythonName',
}
const mockLabOnDeck2Flex = {
  stack: ['labId2', 'labId', 'mockHsId', 'D1'],
  id: 'labId2',
  labwareDefURI: 'mockUri2',
  def: fixture96Plate as LabwareDefinition2,
  pythonName: 'mockPythonName',
}

const mockFlex2DeckSetup: AllTemporalPropertiesForTimelineFrame = {
  labware: {
    labId: mockLabOnDeck1Flex,
    labId2: mockLabOnDeck2Flex,
    labId3: mockLabOnStagingArea,
  },
  pipettes: {},
  modules: {
    hs: mockHSFlex,
    temp: {
      id: 'mockTempId',
      model: TEMPERATURE_MODULE_V1,
      type: TEMPERATURE_MODULE_TYPE,
      slot: 'C1',
      moduleState: {} as any,
      pythonName: 'mockPythonName',
    },
  },
  additionalEquipmentOnDeck: {
    trash: mockTrash,
    wasteChute: mockWasteChute,
    stagingArea: mockStagingArea,
  },
}

describe('getSlotInformation', () => {
  it('renders a heater-shaker with a labware and nested labware for an ot-2 in slot 1 with other mods added', () => {
    expect(
      getSlotInformation({ deckSetup: mockOt2DeckSetup, slot: '1' })
    ).toEqual({
      matchingLabwareFor4thColumn: null,
      createdModuleForSlot: mockHS,
      createdAdapterForSlot: mockLabOnDeck1,
      createdStackForSlot: [mockLabOnDeck2.id],
      createdFixtureForSlots: [],
      slotPosition: null,
      isSlotAHopper: false,
      isSlotAVacuumDock: false,
    })
  })
  it('renders only a labware for ot-2 on slot 2', () => {
    expect(
      getSlotInformation({ deckSetup: mockOt2DeckSetup, slot: '2' })
    ).toEqual({
      matchingLabwareFor4thColumn: null,
      createdAdapterForSlot: mockLabOnDeck3,
      createdFixtureForSlots: [],
      slotPosition: null,
      createdStackForSlot: [],
      isSlotAHopper: false,
      isSlotAVacuumDock: false,
    })
  })
  it('renders no items on the slot for a flex', () => {
    const mockDeckSetup: AllTemporalPropertiesForTimelineFrame = {
      labware: {},
      pipettes: {},
      modules: {},
      additionalEquipmentOnDeck: {},
    }
    expect(
      getSlotInformation({ deckSetup: mockDeckSetup, slot: 'A1' })
    ).toEqual({
      matchingLabwareFor4thColumn: null,
      slotPosition: null,
      createdFixtureForSlots: [],
      createdStackForSlot: [],
      isSlotAHopper: false,
      isSlotAVacuumDock: false,
    })
  })
  it('renders the slot as a hopper', () => {
    const mockDeckSetup: AllTemporalPropertiesForTimelineFrame = {
      labware: {},
      pipettes: {},
      modules: {},
      additionalEquipmentOnDeck: {},
    }
    expect(
      getSlotInformation({ deckSetup: mockDeckSetup, slot: 'hopperA4' })
    ).toEqual({
      matchingLabwareFor4thColumn: null,
      slotPosition: null,
      createdFixtureForSlots: [],
      createdStackForSlot: [],
      isSlotAHopper: true,
      isSlotAVacuumDock: false,
    })
  })
  it('renders a trashbin for a Flex on slot A3', () => {
    expect(
      getSlotInformation({ deckSetup: mockFlex2DeckSetup, slot: 'A3' })
    ).toEqual({
      matchingLabwareFor4thColumn: null,
      slotPosition: null,
      createdFixtureForSlots: [mockTrash],
      preSelectedFixture: 'trashBin',
      createdStackForSlot: [],
      isSlotAHopper: false,
      isSlotAVacuumDock: false,
    })
  })
  it('renders a h-s, labware and nested labware for a Flex on slot D1', () => {
    expect(
      getSlotInformation({ deckSetup: mockFlex2DeckSetup, slot: 'D1' })
    ).toEqual({
      matchingLabwareFor4thColumn: null,
      slotPosition: null,
      createdModuleForSlot: mockHSFlex,
      createdAdapterForSlot: mockLabOnDeck1Flex,
      createdStackForSlot: [mockLabOnDeck2Flex.id],
      createdFixtureForSlots: [],
      isSlotAHopper: false,
      isSlotAVacuumDock: false,
    })
  })
  it('renders the waste chute and staging area for slot D3 for Flex', () => {
    expect(
      getSlotInformation({ deckSetup: mockFlex2DeckSetup, slot: 'D3' })
    ).toEqual({
      matchingLabwareFor4thColumn: mockLabOnStagingArea,
      slotPosition: null,
      createdFixtureForSlots: [mockWasteChute, mockStagingArea],
      preSelectedFixture: 'wasteChuteAndStagingArea',
      createdStackForSlot: [],
      isSlotAHopper: false,
      isSlotAVacuumDock: false,
    })
  })
  it('renders the staging area with waste chute and labware in slot D4 for flex', () => {
    expect(
      getSlotInformation({ deckSetup: mockFlex2DeckSetup, slot: 'D4' })
    ).toEqual({
      matchingLabwareFor4thColumn: null,
      slotPosition: null,
      createdStackForSlot: [mockLabOnStagingArea.id],
      createdFixtureForSlots: [mockWasteChute, mockStagingArea],
      preSelectedFixture: 'wasteChuteAndStagingArea',
      isSlotAHopper: false,
      isSlotAVacuumDock: false,
    })
  })
})

describe('formatTime', () => {
  it('input is 3:3:3 and output is 03:03:03', () => {
    expect(formatTime('3:3:3')).toEqual('03:03:03')
  })
  it('input is 3:3 and output is 03:03', () => {
    expect(formatTime('3:3')).toEqual('03:03')
  })
  it('input is 30:12 and output is 30:12', () => {
    expect(formatTime('30:12')).toEqual('30:12')
  })
  it('input is 12:23:34 and output is 12:23:34', () => {
    expect(formatTime('12:23:34')).toEqual('12:23:34')
  })
  it('input is 0:03 and output is 00:03', () => {
    expect(formatTime('0:03')).toEqual('00:03')
  })
})

describe('_sortLabwareDropdownOptions', () => {
  const zzzPlateOption = { name: 'Zzz Plate', value: 'zzz' }
  const aaaPlateOption = { name: 'Aaa Plate', value: 'aaa' }
  it('should sort labware ids in alphabetical order', () => {
    const result = _sortLabwareDropdownOptions([aaaPlateOption, zzzPlateOption])
    expect(result).toEqual([aaaPlateOption, zzzPlateOption])
  })

  it('should handle {} case', () => {
    const result = _sortLabwareDropdownOptions([])
    expect(result).toEqual([])
  })
})

const mockT = (key: string) => key

describe('getUnoccupiedStackOptions', () => {
  const mockRobotState: RobotState = {
    labware: { labId: { stack: ['labId', 'mockHsId', 'D1'] } },
    pipettes: {},
    modules: {},
    tipState: {} as any,
    liquidState: {} as any,
  }

  it('should render a labware on a stack', () => {
    const mockLabware: AllTemporalPropertiesForTimelineFrame['labware'] = {
      labId: mockLabOnDeck1Flex,
      labId2: {
        ...mockLabOnDeck2Flex,
        def: {
          ...fixture96Plate,
          compatibleParentLabware: [fixtureTiprackAdapter.parameters.loadName],
        } as LabwareDefinition2,
      },
      labId3: mockLabOnStagingArea,
    }
    expect(
      getUnoccupiedStackOptions({
        robotState: mockRobotState,
        deckSetupLabware: mockLabware,
        labwareIdFromDropdown: 'labId2',
        labwareEntities: mockLabware,
        t: mockT,
      })
    ).toEqual([
      {
        name: 'Fixture Flex 96 Tip Rack Adapter',
        value: 'labId',
        deckLabel: 'D1',
      },
    ])
  })
  it('should render no labware', () => {
    const mockLabware: AllTemporalPropertiesForTimelineFrame['labware'] = {
      labId: mockLabOnDeck1Flex,
    }
    expect(
      getUnoccupiedStackOptions({
        robotState: mockRobotState,
        deckSetupLabware: mockLabware,
        labwareIdFromDropdown: 'labId',
        labwareEntities: mockLabware,
        t: mockT,
      })
    ).toEqual([])
  })

  it('should filter out labware that was moved to a waste chute', () => {
    const mockLabware: AllTemporalPropertiesForTimelineFrame['labware'] = {
      labId: mockLabOnDeck1Flex,
      labId2: {
        ...mockLabOnDeck2Flex,
        stack: ['labId2', 'gripperWasteChute'],
      },
    }
    expect(
      getUnoccupiedStackOptions({
        robotState: mockRobotState,
        deckSetupLabware: mockLabware,
        labwareIdFromDropdown: 'labId',
        labwareEntities: mockLabware,
        t: mockT,
      })
    ).toEqual([])
  })
  it('renders the slot as a vacuum dock', () => {
    const mockDeckSetup: AllTemporalPropertiesForTimelineFrame = {
      labware: {},
      pipettes: {},
      modules: {},
      additionalEquipmentOnDeck: {},
    }
    expect(
      getSlotInformation({
        deckSetup: mockDeckSetup,
        slot: 'vacuumModuleV1DockA4',
      })
    ).toEqual({
      matchingLabwareFor4thColumn: null,
      slotPosition: null,
      createdFixtureForSlots: [],
      createdStackForSlot: [],
      isSlotAHopper: false,
      isSlotAVacuumDock: true,
    })
  })
})
