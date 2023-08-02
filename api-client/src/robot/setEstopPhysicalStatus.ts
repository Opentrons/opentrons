import { PUT, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { EstopStatus } from './types'

export function setEstopPhysicalStatus(
  config: HostConfig,
  data: null
): ResponsePromise<EstopStatus> {
  return request<EstopStatus, null>(
    PUT,
    '/robot/control/acknowledgeEstopDisengage',
    data,
    config
  )
}
