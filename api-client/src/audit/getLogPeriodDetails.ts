import { GET, request } from '../request'

import type { RequestConfig, ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { LogPeriodDetailsResponse } from './types'

export function getLogPeriodDetails(
  config: HostConfig,
  logPeriodId: string,
  responseType?: RequestConfig<unknown>['responseType']
): ResponsePromise<LogPeriodDetailsResponse> {
  return request<LogPeriodDetailsResponse>(
    GET,
    `/audit/external/logPeriods/${logPeriodId}`,
    config,
    { responseType }
  )
}
