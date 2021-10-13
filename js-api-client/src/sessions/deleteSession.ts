import { DELETE, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { Session } from './types'

export function deleteSession(
  config: HostConfig,
  sessionId: string
): ResponsePromise<Session> {
  return request<Session>(DELETE, `/sessions/${sessionId}`, null, config)
}
