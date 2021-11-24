import { POST, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { LabwareOffset, Run } from './types'

export interface CreateLabwareOffsetsData {
  labwareOffsets: LabwareOffset[]
}

export function createLabwareOffsets(
  config: HostConfig,
  runId: string,
  data: CreateLabwareOffsetsData
): ResponsePromise<Run> {
  return request<Run, { data: CreateLabwareOffsetsData }>(
    POST,
    `/runs/${runId}`,
    { data },
    config
  )
}
