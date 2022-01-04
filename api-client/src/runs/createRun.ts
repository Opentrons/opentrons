import { POST, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { Run, LabwareOffsetCreateData } from './types'

export interface CreateRunData {
  protocolId?: string
  labwareOffsets?: LabwareOffsetCreateData[]
}

export function createRun(
  config: HostConfig,
  data: CreateRunData = {}
): ResponsePromise<Run> {
  return request<Run, { data: CreateRunData }>(POST, '/runs', { data }, config)
}
