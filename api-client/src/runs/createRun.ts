import { POST, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { Run, RunType } from './types'

export interface CreateRunData {
  runType: RunType
  createParams?: Record<string, unknown>
}

export function createRun(
  config: HostConfig,
  data?: CreateRunData
): ResponsePromise<Run> {
  return request<
    Run,
    { data: { runType: RunType; createParams?: unknown } | undefined }
  >(POST, '/runs', { data }, config)
}
