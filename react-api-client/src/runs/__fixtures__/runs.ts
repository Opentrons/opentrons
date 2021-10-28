import {
  EVENT_SOURCE_PROTOCOL,
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

export const mockPausedRun: ProtocolRun = {
  id: '1',
  createdAt: '2021-10-07T18:44:49.366581+00:00',
  details: {
    protocolId: PROTOCOL_ID,
    currentState: 'paused',
    events: [
      {
        source: EVENT_SOURCE_PROTOCOL,
        event: RUN_ACTION_TYPE_PLAY,
        timestamp: '2021-10-25T12:54:53.366581+00:00',
      },
      {
        source: EVENT_SOURCE_PROTOCOL,
        event: RUN_ACTION_TYPE_PAUSE,
        timestamp: '2021-10-25T13:23:31.366581+00:00',
      },
    ],
  },
  runType: RUN_TYPE_PROTOCOL,
  createParams: { protocolId: PROTOCOL_ID },
}

export const mockRunningRun: ProtocolRun = {
  id: '2',
  createdAt: '2021-10-07T18:44:49.366581+00:00',
  details: {
    protocolId: '1',
    currentState: 'running',
    events: [
      {
        source: EVENT_SOURCE_PROTOCOL,
        event: RUN_ACTION_TYPE_PLAY,
        timestamp: '2021-10-25T12:54:53.366581+00:00',
      },
      {
        source: EVENT_SOURCE_PROTOCOL,
        event: RUN_ACTION_TYPE_PAUSE,
        timestamp: '2021-10-25T13:23:31.366581+00:00',
      },
    ],
  },
  runType: RUN_TYPE_PROTOCOL,
  createParams: { protocolId: PROTOCOL_ID },
}

const mockBasicRun: BasicRun = {
  id: '1',
  createdAt: '2021-10-07T18:44:49.366581+00:00',
  details: {},
  runType: RUN_TYPE_BASIC,
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
