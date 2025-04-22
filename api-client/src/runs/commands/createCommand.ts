import { POST, request } from '../../request'

import type { CreateCommand } from '@opentrons/shared-data'
import type { ResponsePromise } from '../../request'
import type { HostConfig } from '../../types'
import type { CommandData } from '../types'
import type { CreateCommandParams } from './types'

export function createCommand(
  config: HostConfig,
  runId: string,
  data: CreateCommand,
  params?: CreateCommandParams
): ResponsePromise<CommandData> {
  return request<CommandData, { data: CreateCommand }>(
    POST,
    `/runs/${runId}/commands`,
    { data },
    config,
    params
  )
}
