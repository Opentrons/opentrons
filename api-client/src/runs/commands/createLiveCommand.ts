import { POST, request } from '../../request'

import type { ResponsePromise } from '../../request'
import type { HostConfig } from '../../types'
import type { CommandData } from '../types'
import type { CreateCommandParams } from './types'
import type { CreateCommand } from '@opentrons/shared-data/protocol/types/schemaV7'

export function createLiveCommand(
  config: HostConfig,
  data: CreateCommand,
  params?: CreateCommandParams
): ResponsePromise<CommandData> {
  return request<CommandData, { data: CreateCommand }>(
    POST,
    `/commands`,
    { data },
    config,
    params
  )
}
