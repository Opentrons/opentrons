import { DELETE, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig, EmptyResponse } from '../types'

export function deleteMaintenanceRun(
  config: HostConfig,
  maintenanceRunId: string
): ResponsePromise<EmptyResponse> {
  return request<EmptyResponse>(
    DELETE,
    `/maintenance_runs/${maintenanceRunId}`,
    null,
    config
  )
}
