import { POST, request } from '../../request'

import type { ResponsePromise } from '../../request'
import type { HostConfig } from '../../types'
import type { Command } from '../types'

export interface CreateCommandData {
  commandType: string
  params: Record<string, any>
}

export function createCommand(
  config: HostConfig,
  runId: string,
  data: CreateCommandData
): ResponsePromise<Command> {
  return request<Command, { data: CreateCommandData }>(
    POST,
    `/runs/${runId}/commands`,
    { data },
    config
  )
}
