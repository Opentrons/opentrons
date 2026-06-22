import { PATCH, request } from '../request'

import type { ResponsePromise } from '../request'
import type { EmptyResponse, HostConfig } from '../types'

export function dismissCurrentRun(
  config: HostConfig,
  runId: string
): ResponsePromise<EmptyResponse> {
  return request<EmptyResponse, { data: { current: false } }>(
    PATCH,
    `/runs/${runId}`,
    config,
    { body: { data: { current: false } } }
  )
}
