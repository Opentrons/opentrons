import { POST, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { EstopPhysicalStatus } from './types'

export function setEstopPhysicalStatus(
  config: HostConfig,
  data: EstopPhysicalStatus
): ResponsePromise<EstopPhysicalStatus> {
  return request<EstopPhysicalStatus, EstopPhysicalStatus>(
    POST,
    '/robot/control/acknowledgeEstopDisengage',
    data,
    config
  )
}
