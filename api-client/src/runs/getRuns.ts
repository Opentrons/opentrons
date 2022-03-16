import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { RunSummaries } from './types'

export function getRuns(config: HostConfig): ResponsePromise<RunSummaries> {
  return request<RunSummaries>(GET, `/runs`, null, config)
}
