import { PUT, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { SystemTimeRequest, SystemTimeResponse } from './types'

export function putSystemTime(
  config: HostConfig,
  systemTime: string,
  userNotes?: string
): ResponsePromise<SystemTimeResponse> {
  return request<SystemTimeResponse, SystemTimeRequest>(
    PUT,
    '/system/time',
    config,
    {
      body: { data: { systemTime } },
      userNotes,
    }
  )
}
