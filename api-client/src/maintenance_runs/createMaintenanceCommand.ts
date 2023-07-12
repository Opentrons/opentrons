import { POST, request } from '../request'

import type { CreateCommand } from '@opentrons/shared-data/protocol/types/schemaV6'
import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { CommandData, CreateCommandParams } from '../runs/types'

export function createMaintenanceCommand(
  config: HostConfig,
  maintenanceRunId: string,
  data: CreateCommand,
  params?: CreateCommandParams
): ResponsePromise<CommandData> {
  return request<CommandData, { data: CreateCommand }>(
    POST,
    `/maintenance_runs/${maintenanceRunId}/commands`,
    { data },
    config,
    params
  )
}
