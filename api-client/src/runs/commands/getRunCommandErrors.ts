import { GET, request } from '../../request'

import type { ResponsePromise } from '../../request'
import type { HostConfig } from '../../types'
import type { GetCommandsParams, RunCommandErrors } from '../types'

export function getRunCommandErrors(
  config: HostConfig,
  runId: string,
  params: GetCommandsParams
): ResponsePromise<RunCommandErrors> {
  return request<RunCommandErrors>(
    GET,
    `/runs/${runId}/commandErrors`,
    null,
    config,
    params
  )
}
