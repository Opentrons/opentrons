import { POST, request } from '../request'
import type { ResponsePromise } from '../request'
import type { CommandData, CreateCommandParams } from '../runs/types'
import type { HostConfig } from '../types'
import type { CreateCommand } from '@opentrons/shared-data/protocol/types/schemaV6'

export function createMaintenanceCommand(
  config: HostConfig,
  runId: string,
  data: CreateCommand,
  params?: CreateCommandParams
): ResponsePromise<CommandData> {
  return request<CommandData, { data: CreateCommand }>(
    POST,
    `/maintenance_runs/${runId}/commands`,
    { data },
    config,
    params
  )
}
