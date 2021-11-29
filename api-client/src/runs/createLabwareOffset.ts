import { POST, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { LabwareOffset, Run } from './types'

export function createLabwareOffset(
  config: HostConfig,
  runId: string,
  data: LabwareOffset
): ResponsePromise<Run> {
  return request<Run, { data: LabwareOffset }>(
    POST,
    `/runs/${runId}/labware_offsets`,
    { data },
    config
  )
}
