import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { SystemTimeResponse } from './types'

export function getSystemTime(
  config: HostConfig
): ResponsePromise<SystemTimeResponse> {
  return request<SystemTimeResponse>(GET, '/system/time', config)
}
