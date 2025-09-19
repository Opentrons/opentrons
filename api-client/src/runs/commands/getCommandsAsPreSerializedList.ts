import { GET, request } from '../../request'

import type { ResponsePromise } from '../../request'
import type { HostConfig } from '../../types'
import type {
  CommandsAsPreSerializedListData,
  GetRunCommandsParamsRequest,
} from './types'

export function getCommandsAsPreSerializedList(
  config: HostConfig,
  runId: string,
  params: GetRunCommandsParamsRequest
): ResponsePromise<CommandsAsPreSerializedListData> {
  return request<CommandsAsPreSerializedListData>(
    GET,
    `/runs/${runId}/commandsAsPreSerializedList`,
    null,
    config,
    params
  )
}
