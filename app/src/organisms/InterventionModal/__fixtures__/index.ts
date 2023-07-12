import {
  LabwareDefinition2,
  ModuleDefinition,
  SPAN7_8_10_11_SLOT,
} from '@opentrons/shared-data'
import thermocyclerModuleV1 from '@opentrons/shared-data/module/definitions/3/thermocyclerModuleV1.json'

import type { RunData } from '@opentrons/api-client'
import type {
  LabwareDefinitionsByUri,
  LoadedLabware,
  LoadedModule,
} from '@opentrons/shared-data'

export const longCommandMessage =
  'This is a user generated message that gives details about the pause command. This text is truncated to 220 characters. semper risus in hendrerit gravida rutrum quisque non tellus orci ac auctor augue mauris augue neque gravida in fermentum et sollicitudin ac orci phasellus egestas tellus rutrum tellus pellentesque'

export const truncatedCommandMessage =
  'This is a user generated message that gives details about the pause command. This text is truncated to 220 characters. semper risus in hendrerit gravida rutrum quisque non tellus orci ac auctor augue mauris augue nequ...'

export const shortCommandMessage =
  "this won't get truncated because it isn't more than 220 characters."

export const MOCK_LABWARE_ID = '71e1664f-3e69-400a-931b-1ddfa3bff5c8'
export const MOCK_MODULE_ID = 'f806ff9f-3b17-4692-aa63-f77c57fe18d1'

export const mockPauseCommandWithStartTime = {
  commandType: 'waitForResume',
  startedAt: new Date(),
  params: {
    message: longCommandMessage,
  },
} as any

export const mockPauseCommandWithoutStartTime = {
  commandType: 'waitForResume',
  startedAt: null,
  params: {
    message: longCommandMessage,
  },
} as any

export const mockPauseCommandWithShortMessage = {
  commandType: 'waitForResume',
  startedAt: null,
  params: {
    message: shortCommandMessage,
  },
} as any

export const mockPauseCommandWithNoMessage = {
  commandType: 'waitForResume',
  startedAt: null,
  params: {
    message: null,
  },
} as any

export const mockMoveLabwareCommandFromSlot = {
  commandType: 'moveLabware',
  params: {
    labwareId: 'mockLabwareID2',
    newLocation: {
      slotName: 'D3',
    },
    strategy: 'manualMoveWithPause',
  },
} as any

export const mockMoveLabwareCommandFromModule = {
  commandType: 'moveLabware',
  params: {
    labwareId: 'mockLabwareID',
    newLocation: {
      slotName: 'C1',
    },
    strategy: 'manualMoveWithPause',
  },
} as any

export const mockMoveLabwareCommandToModule = {
  commandType: 'moveLabware',
  params: {
    labwareId: 'mockLabwareID2',
    newLocation: {
      moduleId: 'mockTCModuleID',
    },
    strategy: 'manualMoveWithPause',
  },
} as any

export const mockMoveLabwareCommandToOffDeck = {
  commandType: 'moveLabware',
  params: {
    labwareId: 'offDeckMove',
    newLocation: 'offDeck',
  },
  strategy: 'manualMoveWithPause',
} as any

export const mockLabwareOnModule: LoadedLabware = {
  id: 'mockLabwareID',
  loadName: 'nest_96_wellplate_100ul_pcr_full_skirt',
  definitionUri: 'opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1',
  location: {
    moduleId: 'mockModuleID',
  },
}

export const mockLabwareOnSlot: LoadedLabware = {
  id: 'mockLabwareID2',
  loadName: 'nest_96_wellplate_100ul_pcr_full_skirt',
  definitionUri: 'opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1',
  location: {
    slotName: '1',
  },
}

export const mockLabwareOffDeck: LoadedLabware = {
  id: 'mockLabwareID3',
  loadName: 'nest_96_wellplate_100ul_pcr_full_skirt',
  definitionUri: 'opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1',
  location: 'offDeck',
}

export const mockLabwareDefinition = ({
  schemaVersion: 2,
  version: 1,
  namespace: 'opentrons',
  metadata: {
    displayName: 'NEST 96 Well Plate 100 µL PCR Full Skirt',
    displayCategory: 'wellPlate',
    displayVolumeUnits: 'µL',
    tags: [],
  },
  parameters: {
    format: '96Standard',
    isTiprack: false,
    loadName: 'nest_96_wellplate_100ul_pcr_full_skirt',
    isMagneticModuleCompatible: true,
    magneticModuleEngageHeight: 20,
  },
  cornerOffsetFromSlot: {
    x: 0,
    y: 0,
    z: 0,
  },
  dimensions: {
    yDimension: 85.48,
    zDimension: 15.7,
    xDimension: 127.76,
  },
} as unknown) as LabwareDefinition2

export const mockLabwareDefinitionsByUri = {
  'opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1': mockLabwareDefinition,
} as LabwareDefinitionsByUri

export const mockModule: LoadedModule = {
  id: 'mockModuleID',
  model: 'heaterShakerModuleV1',
  location: {
    slotName: '3',
  },
  serialNumber: 'dummySerialHS',
}

export const mockThermocyclerModule: LoadedModule = {
  id: 'mockTCModuleID',
  model: 'thermocyclerModuleV1',
  location: {
    slotName: SPAN7_8_10_11_SLOT,
  },
  serialNumber: 'dummySerialTC',
}

export const mockRunData: RunData = {
  id: 'mockRunData',
  createdAt: '',
  completedAt: '',
  startedAt: '',
  current: true,
  status: 'running',
  actions: [],
  errors: [],
  pipettes: [],
  labware: [mockLabwareOnModule, mockLabwareOnSlot, mockLabwareOffDeck],
  modules: [mockModule],
}

export const mockLabwareRenderInfo = [
  {
    x: 0,
    y: 0,
    labwareId: 'mockLabwareID2',
    labwareDef: mockLabwareDefinition,
  },
]

export const mockModuleRenderInfoWithLabware = [
  {
    moduleId: 'mockTCModuleID',
    x: 100,
    y: 100,
    moduleDef: (thermocyclerModuleV1 as unknown) as ModuleDefinition,
    nestedLabwareDef: mockLabwareDefinition,
    nestedLabwareId: 'mockLabwareID',
  },
]

export const mockModuleRenderInfoWithoutLabware = [
  {
    moduleId: 'mockTCModuleID',
    x: 100,
    y: 100,
    moduleDef: (thermocyclerModuleV1 as unknown) as ModuleDefinition,
    nestedLabwareDef: null,
    nestedLabwareId: null,
  },
]
