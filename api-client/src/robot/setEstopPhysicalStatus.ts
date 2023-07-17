import { PUT, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { EstopStatus, SetEstopState } from './types'

export function setEstopPhysicalStatus(
  config: HostConfig,
  data: SetEstopState
): ResponsePromise<EstopStatus> {
  return request<EstopStatus, SetEstopState>(
    PUT,
    '/robot/control/acknowledgeEstopDisengage',
    data,
    config
  )
}
