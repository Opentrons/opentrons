import { POST, request } from '../request'

import type { CreateCommand } from '@opentrons/shared-data'
import type { ResponsePromise } from '../request'
import type { CommandData, CreateCommandParams } from '../runs/types'
import type { HostConfig } from '../types'

export function createMaintenanceCommand(
  config: HostConfig,
  maintenanceRunId: string,
  data: CreateCommand,
  params?: CreateCommandParams,
  userNotes?: string
): ResponsePromise<CommandData> {
  return request<CommandData, { data: CreateCommand }>(
    POST,
    `/maintenance_runs/${maintenanceRunId}/commands`,
    config,
    { queryParams: { ...params }, body: { data }, userNotes }
  )
}
