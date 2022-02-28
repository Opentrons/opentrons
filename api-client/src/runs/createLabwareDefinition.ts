import { POST, request } from '../request'

import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { Run } from './types'

export function createLabwareDefinition(
  config: HostConfig,
  runId: string,
  data: LabwareDefinition2
): ResponsePromise<Run> {
  return request<Run, { data: LabwareDefinition2 }>(
    POST,
    `/runs/${runId}/labware_definitions`,
    { data },
    config
  )
}
