import { POST, request } from '../../request'

import type { ResponsePromise } from '../../request'
import type { HostConfig } from '../../types'
import type { CommandData } from '../types'
import type { AnonymousCommand } from './types'

export function createCommand(
  config: HostConfig,
  runId: string,
  data: AnonymousCommand
): ResponsePromise<CommandData> {
  return request<CommandData, { data: AnonymousCommand }>(
    POST,
    `/runs/${runId}/commands`,
    { data },
    config
  )
}
