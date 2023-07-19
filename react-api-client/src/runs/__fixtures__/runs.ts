import {
  RUN_ACTION_TYPE_PLAY,
  RUN_ACTION_TYPE_PAUSE,
  Run,
  Runs,
  RunData,
} from '@opentrons/api-client'

export const PROTOCOL_ID = '1'
export const RUN_ID_1 = '1'
export const RUN_ID_2 = '2'

export const mockPausedRun: RunData = {
  id: RUN_ID_1,
  createdAt: '2021-10-07T18:44:49.366581+00:00',
  status: 'paused',
  current: true,
  protocolId: PROTOCOL_ID,
  actions: [
    {
      id: '1',
      createdAt: '2021-10-25T12:54:53.366581+00:00',
      actionType: RUN_ACTION_TYPE_PLAY,
    },
    {
      id: '2',
      createdAt: '2021-10-25T13:23:31.366581+00:00',
      actionType: RUN_ACTION_TYPE_PAUSE,
    },
  ],
  errors: [],
  pipettes: [],
  labware: [],
  modules: [],
}

export const mockRunningRun: RunData = {
  id: RUN_ID_2,
  createdAt: '2021-10-07T18:44:49.366581+00:00',
  status: 'running',
  current: false,
  protocolId: PROTOCOL_ID,
  actions: [
    {
      id: '1',
      createdAt: '2021-10-25T12:54:53.366581+00:00',
      actionType: RUN_ACTION_TYPE_PLAY,
    },
    {
      id: '2',
      createdAt: '2021-10-25T13:23:31.366581+00:00',
      actionType: RUN_ACTION_TYPE_PAUSE,
    },
    {
      id: '3',
      createdAt: '2021-10-25T13:26:42.366581+00:00',
      actionType: RUN_ACTION_TYPE_PLAY,
    },
  ],
  errors: [],
  pipettes: [],
  labware: [],
  modules: [],
}

export const mockRunResponse: Run = {
  data: mockRunningRun,
}

export const mockRunsResponse: Runs = {
  data: [mockRunningRun, mockPausedRun],
  links: { current: { href: 'runs/1' } },
}
