import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { Run } from './types'

export function getRun(
  config: HostConfig,
  runId: string
): ResponsePromise<Run> {
  return request<Run>(GET, `/runs/${runId}`, null, config)
}
