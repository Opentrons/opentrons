import { GET, request } from '../request'

import type { RequestConfig, ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { LogPeriodDetails } from './types'

export function getLogPeriodDetails(
  config: HostConfig,
  logPeriodId: string,
  responseType?: RequestConfig<unknown>['responseType']
): ResponsePromise<LogPeriodDetails> {
  return request<LogPeriodDetails>(
    GET,
    `/audit/external/logPeriods/${logPeriodId}`,
    config,
    { responseType }
  )
}
