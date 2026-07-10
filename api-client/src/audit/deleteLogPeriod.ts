import { DELETE, request } from '../request'

import type { ResponsePromise } from '../request'
import type { EmptyResponse, HostConfig } from '../types'

// TODO(nd, 2026-07-09): server endpoint is not implemented yet; confirm the
// actual response shape once it lands and drop EmptyResponse if it differs.
export function deleteLogPeriod(
  config: HostConfig,
  logPeriodId: string
): ResponsePromise<EmptyResponse> {
  return request<EmptyResponse>(
    DELETE,
    `/audit/external/logPeriods/${logPeriodId}`,
    config
  )
}
