import { POST, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { LabwareDefinitionSummary } from './types'
import { LabwareDefinition2 } from '@opentrons/shared-data'

export function createMaintenanceRunLabwareDefinition(
  config: HostConfig,
  maintenanceRunId: string,
  data: LabwareDefinition2
): ResponsePromise<LabwareDefinitionSummary> {
  return request<LabwareDefinitionSummary, { data: LabwareDefinition2 }>(
    POST,
    `/maintenance_runs/${maintenanceRunId}/labware_definitions`,
    { data },
    config
  )
}
