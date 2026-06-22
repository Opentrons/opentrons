import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { LogPeriodsResponse } from './types'

export function getLogPeriods(
  config: HostConfig
): ResponsePromise<LogPeriodsResponse> {
  return request<LogPeriodsResponse>(GET, '/audit/external/logPeriods', config)
}
