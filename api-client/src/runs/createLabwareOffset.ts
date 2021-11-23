import { POST, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { LabwareOffset, Run } from './types'

export interface CreateLabwareOffsetData {
  labwareOffsets: LabwareOffset[]
}

export function createLabwareOffset(
  config: HostConfig,
  runId: string,
  data: CreateLabwareOffsetData
): ResponsePromise<Run> {
  return request<Run, { data: CreateLabwareOffsetData }>(
    POST,
    `/runs/${runId}`,
    { data },
    config
  )
}
