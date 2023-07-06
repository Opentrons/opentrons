import { POST, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { EstopState, SetEstopState } from './types'

export function setEstopPhysicalStatus(
  config: HostConfig,
  data: SetEstopState
): ResponsePromise<EstopState> {
  return request<EstopState, SetEstopState>(
    POST,
    '/robot/control/acknowledgeEstopDisengage',
    data,
    config
  )
}
