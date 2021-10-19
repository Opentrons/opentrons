import { GET, request } from '../../request'

import type { ResponsePromise } from '../../request'
import type { HostConfig } from '../../types'
import type { Session } from '..'

export function getCommand(
  config: HostConfig,
  sessionId: string,
  commandId: string
): ResponsePromise<Session> {
  return request<Session>(
    GET,
    `/sessions/${sessionId}/commands/${commandId}`,
    null,
    config
  )
}
