import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { MaintenanceRun } from './types'

export function getCurrentMaintenanceRun(
  config: HostConfig
): ResponsePromise<MaintenanceRun> {
  return request<MaintenanceRun>(
    GET,
    `/maintenance_runs/current_run`,
    null,
    config
  )
}
