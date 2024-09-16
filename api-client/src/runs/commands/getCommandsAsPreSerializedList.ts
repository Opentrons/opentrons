import { GET, request } from '../../request'

import type { ResponsePromise } from '../../request'
import type { HostConfig } from '../../types'
import type {
  CommandsAsPreSerializedListData,
  GetRunCommandsParams,
} from './types'

export function getCommandsAsPreSerializedList(
  config: HostConfig,
  runId: string,
  params: GetRunCommandsParams
): ResponsePromise<CommandsAsPreSerializedListData> {
  return request<CommandsAsPreSerializedListData>(
    GET,
    `/runs/${runId}/commandsAsPreSerializedList`,
    null,
    config,
    params
  )
}
