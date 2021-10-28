import { POST, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { Run, RUN_TYPE_BASIC, RUN_TYPE_PROTOCOL } from './types'

export interface CreateBasicRunData {
  runType: typeof RUN_TYPE_BASIC
  createParams?: Record<string, unknown>
}

export interface CreateProtocolRunData {
  runType: typeof RUN_TYPE_PROTOCOL
  createParams: { protocolId: string }
}

export type CreateRunData = CreateBasicRunData | CreateProtocolRunData

export function createRun(
  config: HostConfig,
  data: CreateRunData
): ResponsePromise<Run> {
  return request<Run, { data: CreateRunData }>(POST, '/runs', { data }, config)
}
