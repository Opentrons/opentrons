import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { DoorStatus } from './types'

export function getDoorStatus(config: HostConfig): ResponsePromise<DoorStatus> {
  return request<DoorStatus>(GET, '/robot/door/status', null, config)
}
