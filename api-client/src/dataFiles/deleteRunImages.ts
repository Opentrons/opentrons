import { DELETE, request } from '../request'

import type { ResponsePromise } from '../request'
import type { EmptyResponse, HostConfig } from '../types'

export function deleteRunImages(
  config: HostConfig,
  runId: string
): ResponsePromise<EmptyResponse> {
  return request<EmptyResponse>(DELETE, `/dataFiles/${runId}/images`, config)
}
