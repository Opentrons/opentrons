import { PUT, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { EstopStatus } from './types'

export function acknowledgeEstopDisengage(
  config: HostConfig
): ResponsePromise<EstopStatus> {
  return request<EstopStatus>(
    PUT,
    '/robot/control/acknowledgeEstopDisengage',
    null,
    config
  )
}
