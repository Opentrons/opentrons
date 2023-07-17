import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { EstopStatus } from './types'

export function getEstopState(
  config: HostConfig
): ResponsePromise<EstopStatus> {
  return request<EstopStatus>(GET, '/robot/control/estopStatus', null, config)
}
