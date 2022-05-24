import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { AttachedModules } from './types'

export function getModules(
  config: HostConfig
): ResponsePromise<AttachedModules> {
  return request<AttachedModules>(GET, `/modules`, null, config)
}
