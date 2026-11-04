import { GET, request } from '../request'

import type { RequestConfig, ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { DownloadedLogPeriodResponse } from './types'

export function getLogPeriodRaw(
  config: HostConfig,
  logPeriodId: string,
  responseType?: RequestConfig<unknown>['responseType']
): ResponsePromise<DownloadedLogPeriodResponse> {
  return request<DownloadedLogPeriodResponse>(
    GET,
    `/audit/external/logPeriods/${logPeriodId}/download`,
    config,
    { responseType }
  )
}
