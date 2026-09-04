import { PATCH, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { Run } from './types'

export function dismissCurrentRun(
  config: HostConfig,
  runId: string,
  userNotes?: string
): ResponsePromise<Run> {
  return request<Run, { data: { current: false } }>(
    PATCH,
    `/runs/${runId}`,
    config,
    { body: { data: { current: false } }, userNotes }
  )
}
