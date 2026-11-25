import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { LogLevelPayload } from './types'

export function getLogLevel(
  config: HostConfig
): ResponsePromise<LogLevelPayload> {
  return request<LogLevelPayload>(
    GET,
    '/system/settings/log_level/local',
    config
  )
}
