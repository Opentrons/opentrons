import { MAINTENANCE_RUN_ACTION_TYPE_PLAY } from '@opentrons/api-client'
import type { MaintenanceRun, MaintenanceRunData } from '@opentrons/api-client'

export const MAINTENANCE_RUN_ID = '1'

export const mockRunningMaintenanceRun: MaintenanceRunData = {
  id: MAINTENANCE_RUN_ID,
  createdAt: '2021-10-07T18:44:49.366581+00:00',
  status: 'running',
  current: false,
  actions: [
    {
      id: '1',
      createdAt: '2021-10-25T12:54:53.366581+00:00',
      actionType: MAINTENANCE_RUN_ACTION_TYPE_PLAY,
    },
  ],
  errors: [],
  pipettes: [],
  labware: [],
  modules: [],
  liquids: [],
}

export const mockMaintenanceRunResponse: MaintenanceRun = {
  data: mockRunningMaintenanceRun,
}
