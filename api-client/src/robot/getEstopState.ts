import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { EstopState } from './types'

export function getEstopState(config: HostConfig): ResponsePromise<EstopState> {
  return request<EstopState>(GET, '/robot/control/estopStatus', null, config)
}
