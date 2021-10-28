import {
  RunAction,
  RUN_ACTION_TYPE_PLAY,
  RUN_ACTION_TYPE_PAUSE,
  RUN_ACTION_TYPE_STOP,
} from '@opentrons/api-client'

export const mockPlayRunAction: RunAction = {
  id: '1',
  createdAt: '2021-10-25T13:23:31.366581+00:00',
  actionType: RUN_ACTION_TYPE_PLAY,
}

export const mockPauseRunAction: RunAction = {
  id: '2',
  createdAt: '2021-10-25T13:23:31.366581+00:00',
  actionType: RUN_ACTION_TYPE_PAUSE,
}

export const mockStopRunAction: RunAction = {
  id: '3',
  createdAt: '2021-10-25T13:23:31.366581+00:00',
  actionType: RUN_ACTION_TYPE_STOP,
}
