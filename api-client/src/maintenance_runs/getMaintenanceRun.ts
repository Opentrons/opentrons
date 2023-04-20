import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { MaintenanceRun } from './types'

export function getMaintenanceRun(
  config: HostConfig,
  maintenanceRunId: string
): ResponsePromise<MaintenanceRun> {
  return request<MaintenanceRun>(
    GET,
    `/maintenace_runs/${maintenanceRunId}`,
    null,
    config
  )
}
