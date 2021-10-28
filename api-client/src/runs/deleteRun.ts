import { DELETE, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { Run } from './types'

export function deleteRun(
  config: HostConfig,
  runId: string
): ResponsePromise<Run> {
  return request<Run>(DELETE, `/runs/${runId}`, null, config)
}
