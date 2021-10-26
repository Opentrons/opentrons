import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { Session } from './types'

export function getSession(
  config: HostConfig,
  sessionId: string
): ResponsePromise<Session> {
  return request<Session>(GET, `/sessions/${sessionId}`, null, config)
}
