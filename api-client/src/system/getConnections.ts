import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { ActiveConnections } from './types'

export function getConnections(
  config: HostConfig
): ResponsePromise<ActiveConnections> {
  return request<ActiveConnections>(GET, `/system/connected`, null, config)
}
