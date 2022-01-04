import { POST, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { LabwareOffsetCreateData, Run } from './types'

export function createLabwareOffset(
  config: HostConfig,
  runId: string,
  data: LabwareOffsetCreateData
): ResponsePromise<Run> {
  return request<Run, { data: LabwareOffsetCreateData }>(
    POST,
    `/runs/${runId}/labware_offsets`,
    { data },
    config
  )
}
