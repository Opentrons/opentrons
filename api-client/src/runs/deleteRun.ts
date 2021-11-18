import { DELETE, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig, EmptyResponse } from '../types'

export function deleteRun(
  config: HostConfig,
  runId: string
): ResponsePromise<EmptyResponse> {
  return request<EmptyResponse>(DELETE, `/runs/${runId}`, null, config)
}
