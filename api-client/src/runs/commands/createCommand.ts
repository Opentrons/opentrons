import { POST, request } from '../../request'

import type { ResponsePromise } from '../../request'
import type { HostConfig } from '../../types'
import type { CommandData } from '../types'

export interface CreateCommandData {
  commandType: string
  params: Record<string, any>
}

export function createCommand(
  config: HostConfig,
  runId: string,
  data: CreateCommandData
): ResponsePromise<CommandData> {
  return request<CommandData, { data: CreateCommandData }>(
    POST,
    `/runs/${runId}/commands`,
    { data },
    config
  )
}
