import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { RunCurrentState } from './types'

export function getRunCurrentState(
  config: HostConfig,
  runId: string
): ResponsePromise<RunCurrentState> {
  return request<RunCurrentState>(
    GET,
    `/runs/${runId}/currentState`,
    null,
    config
  )
}
