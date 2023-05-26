import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { Run } from '..'

export function getCurrentMaintenanceRun(
  config: HostConfig
): ResponsePromise<Run> {
  return request<Run>(GET, `/maintenance_runs/current_run`, null, config)
}
