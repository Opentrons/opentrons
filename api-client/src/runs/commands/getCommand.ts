import { GET, request } from '../../request'

import type { ResponsePromise } from '../../request'
import type { HostConfig } from '../../types'
import type { CommandDetail } from '../types'

export function getCommand(
  config: HostConfig,
  runId: string,
  commandId: string
): ResponsePromise<CommandDetail> {
  return request<CommandDetail>(
    GET,
    `/runs/${runId}/commands/${commandId}`,
    null,
    config
  )
}
