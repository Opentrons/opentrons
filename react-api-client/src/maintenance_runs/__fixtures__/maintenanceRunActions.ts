import {
  MaintenanceRunAction,
  MAINTENANCE_RUN_ACTION_TYPE_PLAY,
  MAINTENANCE_RUN_ACTION_TYPE_PAUSE,
  MAINTENANCE_RUN_ACTION_TYPE_STOP,
} from '@opentrons/api-client'

export const mockPlayMaintenanceRunAction: MaintenanceRunAction = {
  id: '1',
  createdAt: '2021-10-25T13:23:31.366581+00:00',
  actionType: MAINTENANCE_RUN_ACTION_TYPE_PLAY,
}

export const mockPauseMaintenanceRunAction: MaintenanceRunAction = {
  id: '2',
  createdAt: '2021-10-25T13:23:31.366581+00:00',
  actionType: MAINTENANCE_RUN_ACTION_TYPE_PAUSE,
}

export const mockStopMaintenanceRunAction: MaintenanceRunAction = {
  id: '3',
  createdAt: '2021-10-25T13:23:31.366581+00:00',
  actionType: MAINTENANCE_RUN_ACTION_TYPE_STOP,
}
