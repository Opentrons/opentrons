import { GET, request } from '../../request'

import type { ResponsePromise } from '../../request'
import type { HostConfig } from '../../types'
import type { Commands } from '..'

export function getCommands(
  config: HostConfig,
  sessionId: string
): ResponsePromise<Commands> {
  return request<Commands>(GET, `/sessions/${sessionId}/commands`, null, config)
}
