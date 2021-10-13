import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { Sessions, SessionType } from './types'

export function getSessions(
  config: HostConfig,
  params?: { session_type: SessionType }
): ResponsePromise<Sessions> {
  return request<Sessions>(GET, `/sessions`, null, config, params)
}
