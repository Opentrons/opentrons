import { GET, request } from '../../request'

import type { ResponsePromise } from '../../request'
import type { HostConfig } from '../../types'
import type { CommandsData } from '..'

export function getCommands(
  config: HostConfig,
  runId: string
): ResponsePromise<CommandsData> {
  return request<CommandsData>(GET, `/runs/${runId}/commands`, null, config)
}
