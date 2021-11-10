import { PATCH, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig, EmptyResponse } from '../types'

export function dismissCurrentRun(
  config: HostConfig,
  runId: string
): ResponsePromise<EmptyResponse> {
  return request<EmptyResponse, { data: { current: false } }>(
    PATCH,
    `/runs/${runId}`,
    { data: { current: false } },
    config
  )
}
