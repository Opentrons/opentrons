import { DELETE, request } from '../request'

import type { ResponsePromise } from '../request'
import type { EmptyResponse, HostConfig } from '../types'
import type { DeleteRunData } from './types'

export function deleteRun(
  config: HostConfig,
  runId: string,
  data: DeleteRunData = {}
): ResponsePromise<EmptyResponse> {
  return request<EmptyResponse, { data: DeleteRunData }>(
    DELETE,
    `/runs/${runId}`,
    config,
    { body: { data } }
  )
}
