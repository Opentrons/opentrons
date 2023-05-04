import { POST, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { CreateMaintenanceRunData, MaintenanceRun } from './types'

export function createMaintenanceRun(
  config: HostConfig,
  data: CreateMaintenanceRunData = {}
): ResponsePromise<MaintenanceRun> {
  return request<MaintenanceRun, { data: CreateMaintenanceRunData }>(
    POST,
    '/maintenance_runs',
    { data },
    config
  )
}
