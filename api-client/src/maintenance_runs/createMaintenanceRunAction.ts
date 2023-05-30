import { POST, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { MaintenanceRunAction, MaintenanceRunActionType } from './types'

export interface CreateMaintenanceRunActionData {
  actionType: MaintenanceRunActionType
}

export function createMaintenanceRunAction(
  config: HostConfig,
  maintenanceRunId: string,
  data: CreateMaintenanceRunActionData
): ResponsePromise<MaintenanceRunAction> {
  return request<
    MaintenanceRunAction,
    { data: CreateMaintenanceRunActionData }
  >(POST, `/maintenance_runs/${maintenanceRunId}/actions`, { data }, config)
}
