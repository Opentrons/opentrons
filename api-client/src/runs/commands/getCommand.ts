import { GET, request } from '../../request'

import type { ResponsePromise } from '../../request'
import type { HostConfig } from '../../types'
import type { CommandData } from '../types'

export function getCommand(
  config: HostConfig,
  runId: string,
  commandId: string
): ResponsePromise<CommandData> {
  return request<CommandData>(
    GET,
    `/runs/${runId}/commands/${commandId}`,
    null,
    config
  )
}
