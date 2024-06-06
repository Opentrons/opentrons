import { POST, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type {
  Run,
  LabwareOffsetCreateData,
  RunTimeParameterCreateData,
} from './types'

export interface CreateRunData {
  protocolId?: string
  labwareOffsets?: LabwareOffsetCreateData[]
  runTimeParameterValues?: RunTimeParameterCreateData
}

export function createRun(
  config: HostConfig,
  data: CreateRunData = {}
): ResponsePromise<Run> {
  return request<Run, { data: CreateRunData }>(POST, '/runs', { data }, config)
}
