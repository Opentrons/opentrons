import { DELETE, request } from '../request'

import type { ResponsePromise } from '../request'
import type { EmptyResponse, HostConfig } from '../types'
import type { DeleteRunParams } from './types'

export function deleteRun(
  config: HostConfig,
  runId: string,
  params?: DeleteRunParams
): ResponsePromise<EmptyResponse> {
  return request<EmptyResponse, { data: DeleteRunParams }>(
    DELETE,
    `/runs/${runId}`,
    config,
    { queryParams: { ...params } }
  )
}
