import { DELETE, request } from '../request'

import type { ResponsePromise } from '../request'
import type { EmptyResponse, HostConfig } from '../types'
import type { DeleteLogPeriodQueryParams } from './types'

// TODO(nd, 2026-07-09): server endpoint is not implemented yet; confirm the
// actual response shape once it lands and drop EmptyResponse if it differs.
export function deleteLogPeriod(
  config: HostConfig,
  logPeriodId: string,
  params: DeleteLogPeriodQueryParams,
  userNotes?: string
): ResponsePromise<EmptyResponse> {
  return request<EmptyResponse>(
    DELETE,
    `/audit/external/logPeriods/${logPeriodId}`,
    config,
    { queryParams: { ...params }, userNotes }
  )
}
