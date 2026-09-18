import { GET, request } from '../../request'

import type { CommandsData } from '..'
import type { ResponsePromise } from '../../request'
import type { HostConfig } from '../../types'
import type { GetRunCommandsParamsRequest } from './types'

export function getCommands(
  config: HostConfig,
  runId: string,
  params: GetRunCommandsParamsRequest
): ResponsePromise<CommandsData> {
  return request<CommandsData>(GET, `/runs/${runId}/commands`, config, {
    queryParams: { ...params },
  })
}
