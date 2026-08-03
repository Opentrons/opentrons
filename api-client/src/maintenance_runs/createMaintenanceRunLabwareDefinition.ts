import { POST, request } from '../request'

import type { LabwareDefinition } from '@opentrons/shared-data'
import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { LabwareDefinitionSummary } from './types'

export function createMaintenanceRunLabwareDefinition(
  config: HostConfig,
  maintenanceRunId: string,
  data: LabwareDefinition,
  userNotes?: string
): ResponsePromise<LabwareDefinitionSummary> {
  return request<LabwareDefinitionSummary, { data: LabwareDefinition }>(
    POST,
    `/maintenance_runs/${maintenanceRunId}/labware_definitions`,
    config,
    { body: { data }, userNotes }
  )
}
