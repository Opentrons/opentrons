import { POST, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { LogLevelPayload, LogLevels } from './types'

export function postLogLevel(
  config: HostConfig,
  newLevel: LogLevels,
  userNotes?: string
): ResponsePromise<LogLevelPayload> {
  return request<LogLevelPayload, LogLevelPayload>(
    POST,
    '/system/settings/log_level/local',
    config,
    {
      body: { log_level: newLevel },
      userNotes,
    }
  )
}
