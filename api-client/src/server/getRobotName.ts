import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { CurrentRobotName } from './types'

export function getRobotName(
  config: HostConfig
): ResponsePromise<CurrentRobotName> {
  return request<CurrentRobotName>(GET, '/server/name', null, config)
}
