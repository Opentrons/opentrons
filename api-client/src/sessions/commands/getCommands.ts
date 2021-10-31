import { GET, request } from '../../request'

import type { ResponsePromise } from '../../request'
import type { HostConfig } from '../../types'
import type { Commands } from '..'

export function getCommands(
  config: HostConfig,
  runId: string
): ResponsePromise<Commands> {
  return request<Commands>(GET, `/runs/${runId}/commands`, null, config)
}
