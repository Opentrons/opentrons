import {
  RUN_ACTION_TYPE_PLAY,
  RUN_ACTION_TYPE_PAUSE,
  RUN_ACTION_TYPE_STOP,
  RUN_STATUS_IDLE,
  RUN_STATUS_PAUSE_REQUESTED,
  RUN_STATUS_PAUSED,
  RUN_STATUS_RUNNING,
  RUN_STATUS_SUCCEEDED,
  RUN_STATUS_FAILED,
  RUN_STATUS_STOP_REQUESTED,
  RUN_STATUS_STOPPED,
} from '@opentrons/api-client'

import type { RunData, CommandDetail } from '@opentrons/api-client'

export const PROTOCOL_ID = '1'
export const RUN_ID_1 = '1'
export const RUN_ID_2 = '2'
export const COMMAND_ID = '4'

export const mockPausedRun: RunData = {
  id: RUN_ID_1,
  createdAt: '2021-10-07T18:44:49.366581+00:00',
  current: true,
  status: RUN_STATUS_PAUSED,
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

export const mockPauseRequestedRun: RunData = {
  id: RUN_ID_1,
  createdAt: '2021-10-07T18:44:49.366581+00:00',
  current: true,
  status: RUN_STATUS_PAUSE_REQUESTED,
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
  current: true,
  status: RUN_STATUS_RUNNING,
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

export const mockFailedRun: RunData = {
  id: RUN_ID_2,
  createdAt: '2021-10-07T18:44:49.366581+00:00',
  current: true,
  status: RUN_STATUS_FAILED,
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
  errors: [
    {
      id: '5',
      errorType: 'RuntimeError',
      createdAt: 'noon forty-five',
      detail: 'this run failed',
      errorInfo: {},
      wrappedErrors: [],
      errorCode: '4000',
    },
  ],
  pipettes: [],
  labware: [],
  modules: [],
}

export const mockStopRequestedRun: RunData = {
  id: RUN_ID_2,
  createdAt: '2021-10-07T18:44:49.366581+00:00',
  current: true,
  status: RUN_STATUS_STOP_REQUESTED,
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
    {
      id: '4',
      createdAt: '2021-10-25T13:58:22.366581+00:00',
      actionType: RUN_ACTION_TYPE_STOP,
    },
  ],
  errors: [],
  pipettes: [],
  labware: [],
  modules: [],
}

export const mockStoppedRun: RunData = {
  id: RUN_ID_2,
  createdAt: '2021-10-07T18:44:49.366581+00:00',
  current: true,
  status: RUN_STATUS_STOPPED,
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
    {
      id: '4',
      createdAt: '2021-10-25T13:58:22.366581+00:00',
      actionType: RUN_ACTION_TYPE_STOP,
    },
  ],
  errors: [],
  pipettes: [],
  labware: [],
  modules: [],
}

export const mockSucceededRun: RunData = {
  id: RUN_ID_2,
  createdAt: '2021-10-07T18:44:49.366581+00:00',
  current: true,
  status: RUN_STATUS_SUCCEEDED,
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

export const mockIdleUnstartedRun: RunData = {
  id: RUN_ID_2,
  createdAt: '2021-10-07T18:44:49.366581+00:00',
  current: true,
  status: RUN_STATUS_IDLE,
  protocolId: PROTOCOL_ID,
  actions: [],
  errors: [],
  pipettes: [],
  labware: [],
  modules: [],
}

export const mockIdleStartedRun: RunData = {
  id: RUN_ID_2,
  createdAt: '2021-10-07T18:44:49.366581+00:00',
  current: true,
  status: RUN_STATUS_IDLE,
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

export const mockCommand = {
  data: {
    id: COMMAND_ID,
    completedAt: 'noon thirty',
  },
} as CommandDetail
