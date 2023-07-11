import type { RunData } from '@opentrons/api-client'
import type { LoadedLabware, LoadedModule } from '@opentrons/shared-data'

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

export const mockMoveLabwareCommand = {
  commandType: 'moveLabware',
  params: {
    labwareId: MOCK_LABWARE_ID,
    newLocation: {
      slotName: '5',
    },
    strategy: 'manualMoveWithPause',
  },
} as any

export const mockLabware: LoadedLabware = {
  id: 'mockLabwareID',
  loadName: 'nest_96_wellplate_100ul_pcr_full_skirt',
  definitionUri: 'opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1',
  location: {
    moduleId: 'mockModuleID',
  },
}

export const mockModule: LoadedModule = {
  id: 'mockModuleID',
  model: 'heaterShakerModuleV1',
  location: {
    slotName: '3',
  },
  serialNumber: 'dummySerialHS',
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
  labware: [mockLabware],
  modules: [mockModule],
}
