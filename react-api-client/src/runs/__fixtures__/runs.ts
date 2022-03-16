import {
  RUN_ACTION_TYPE_PLAY,
  RUN_ACTION_TYPE_PAUSE,
  Run,
  RunSummaries,
  RunData,
  RunSummaryData,
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
}

export const mockRunResponse: Run = {
  data: mockRunningRun,
}

export const mockPausedRunSummary: RunSummaryData = {
  id: mockPausedRun.id,
  createdAt: mockPausedRun.createdAt,
  status: mockPausedRun.status,
  current: mockPausedRun.current,
  protocolId: mockPausedRun.protocolId,
}

export const mockRunningRunSummary: RunSummaryData = {
  id: mockRunningRun.id,
  createdAt: mockRunningRun.createdAt,
  status: mockRunningRun.status,
  current: mockRunningRun.current,
  protocolId: mockRunningRun.protocolId,
}

export const mockRunsResponse: RunSummaries = {
  data: [mockRunningRunSummary, mockPausedRunSummary],
  links: { current: { href: 'runs/1' } },
}
