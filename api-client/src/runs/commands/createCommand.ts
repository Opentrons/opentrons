import { POST, request } from '../../request'

import type { ResponsePromise } from '../../request'
import type { HostConfig } from '../../types'
import type { CommandData } from '../types'
import type { CreateCommand } from '@opentrons/shared-data/protocol/types/schemaV6'

export function createCommand(
  config: HostConfig,
  runId: string,
  data: CreateCommand
): ResponsePromise<CommandData> {
  return request<CommandData, { data: CreateCommand }>(
    POST,
    `/runs/${runId}/commands`,
    { data },
    config
  )
}
