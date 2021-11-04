import { GET, request } from '../../request'

import type { ResponsePromise } from '../../request'
import type { HostConfig } from '../../types'
import type { Session } from '..'

export function getCommand(
  config: HostConfig,
  runId: string,
  commandId: string
): ResponsePromise<Session> {
  return request<Session>(
    GET,
    `/runs/${runId}/commands/${commandId}`,
    null,
    config
  )
}
