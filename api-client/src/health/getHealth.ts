import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { Health } from './types'

export function getHealth(config: HostConfig): ResponsePromise<Health> {
  return request<Health>(GET, '/health', null, config)
}
