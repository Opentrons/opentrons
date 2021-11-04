import { GET, request } from '../../request'

import type { ResponsePromise } from '../../request'
import type { HostConfig } from '../../types'
import type { Command } from '../types'

export function getCommand(
  config: HostConfig,
  runId: string,
  commandId: string
): ResponsePromise<Command> {
  return request<Command>(
    GET,
    `/runs/${runId}/commands/${commandId}`,
    null,
    config
  )
}
