import { POST, request } from '../../request'

import type { CreateCommand } from '@opentrons/shared-data'
import type { ResponsePromise } from '../../request'
import type { HostConfig } from '../../types'
import type { CommandData } from '../types'
import type { CreateCommandParams } from './types'

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
