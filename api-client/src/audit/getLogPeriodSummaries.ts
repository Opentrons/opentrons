import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { LogPeriodSummariesResponse } from './types'

export function getLogPeriodSummaries(
  config: HostConfig
): ResponsePromise<LogPeriodSummariesResponse> {
  return request<LogPeriodSummariesResponse>(
    GET,
    '/audit/external/logPeriods',
    config
  )
}
