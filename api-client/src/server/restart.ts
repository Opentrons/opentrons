import { POST, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { RestartResponse } from './types'

export function restart(
  config: HostConfig,
  userNotes?: string
): ResponsePromise<RestartResponse> {
  return request<RestartResponse>(POST, '/server/restart', config, {
    userNotes,
  })
}
