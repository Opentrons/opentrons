import { POST, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { ShutdownResponse } from './types'

export function shutdown(
  config: HostConfig,
  userNotes?: string
): ResponsePromise<ShutdownResponse> {
  return request<ShutdownResponse>(POST, '/server/shutdown', config, {
    userNotes,
  })
}
