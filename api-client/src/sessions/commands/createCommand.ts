import { POST, request } from '../../request'

import type { ResponsePromise } from '../../request'
import type { HostConfig } from '../../types'
import type { Session } from '..'

export interface CreateCommandData {
  commandType: string
  data: Record<string, unknown>
}

export function createCommand(
  config: HostConfig,
  sessionId: string,
  data: CreateCommandData
): ResponsePromise<Session> {
  return request<Session, { data: CreateCommandData }>(
    POST,
    `/sessions/${sessionId}/commands`,
    { data },
    config
  )
}
