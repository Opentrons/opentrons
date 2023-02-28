import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { Lights } from './types'

export function getLights(config: HostConfig): ResponsePromise<Lights> {
  return request<Lights>(GET, '/robot/lights', null, config)
}
