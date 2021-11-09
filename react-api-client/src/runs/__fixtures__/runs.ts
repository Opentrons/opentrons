import {
  RUN_ACTION_TYPE_PLAY,
  RUN_ACTION_TYPE_PAUSE,
  RUN_TYPE_BASIC,
  RUN_TYPE_PROTOCOL,
  BasicRun,
  ProtocolRun,
  Run,
  Runs,
} from '@opentrons/api-client'

export const PROTOCOL_ID = '1'
export const RUN_ID_1 = '1'
export const RUN_ID_2 = '2'

export const mockPausedRun: ProtocolRun = {
  id: RUN_ID_1,
  runType: RUN_TYPE_PROTOCOL,
  createdAt: '2021-10-07T18:44:49.366581+00:00',
  status: 'paused',
  createParams: { protocolId: PROTOCOL_ID },
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
  commands: [],
  pipettes: [],
  labware: [],
}

export const mockRunningRun: ProtocolRun = {
  id: RUN_ID_2,
  runType: RUN_TYPE_PROTOCOL,
  createdAt: '2021-10-07T18:44:49.366581+00:00',
  status: 'running',
  createParams: { protocolId: PROTOCOL_ID },
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
  commands: [],
  pipettes: [],
  labware: [],
}

const mockBasicRun: BasicRun = {
  id: '1',
  runType: RUN_TYPE_BASIC,
  createdAt: '2021-10-07T18:44:49.366581+00:00',
  status: 'ready-to-run',
  actions: [],
  commands: [],
  pipettes: [],
  labware: [],
}

export const mockProtocolRunResponse: Run = {
  data: mockRunningRun,
}

export const mockBasicRunResponse: Run = {
  data: mockBasicRun,
}

export const mockRunsResponse: Runs = {
  data: [mockRunningRun, mockPausedRun],
  // TODO(bh, 2021-10-27): flesh out what 'current' looks like once api settles
  links: { current: '1' },
}
