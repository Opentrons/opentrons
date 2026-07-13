import { POST, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type {
  LabwareOffsetCreateData,
  LegacyLabwareOffsetCreateData,
  Run,
  RunTimeParameterFilesCreateData,
  RunTimeParameterValuesCreateData,
} from './types'

export interface CreateRunData {
  protocolId?: string
  labwareOffsets?: LegacyLabwareOffsetCreateData[] | LabwareOffsetCreateData[]
  runTimeParameterValues?: RunTimeParameterValuesCreateData
  runTimeParameterFiles?: RunTimeParameterFilesCreateData
}

export function createRun(
  config: HostConfig,
  data: CreateRunData = {},
  userNotes?: string
): ResponsePromise<Run> {
  return request<Run, { data: CreateRunData }>(POST, '/runs', config, {
    body: { data },
    userNotes,
  })
}
