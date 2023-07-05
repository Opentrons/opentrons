import { POST, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { EstopState, EstopPhysicalStatus } from './types'

export function setEstopPhysicalStatus(
  config: HostConfig,
  data: EstopPhysicalStatus
): ResponsePromise<EstopState> {
  return request<EstopState, EstopPhysicalStatus>(
    POST,
    '/robot/control/acknowledgeEstopDisengage',
    data,
    config
  )
}
