import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { Modules } from './types'

export function getModules(config: HostConfig): ResponsePromise<Modules> {
  return request<Modules>(GET, `/modules`, null, config)
}
