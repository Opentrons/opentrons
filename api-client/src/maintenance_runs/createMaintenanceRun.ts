import { POST, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { MaintenanceRun } from './types'

export function createMaintenanceRun(
  config: HostConfig
): ResponsePromise<MaintenanceRun> {
  return request<MaintenanceRun>(POST, '/maintenance_runs', null, config)
}
