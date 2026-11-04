import { DELETE, request } from '../request'

import type { ResponsePromise } from '../request'
import type { EmptyResponse, HostConfig } from '../types'

export function deleteRunImages(
  config: HostConfig,
  runId: string,
  userNotes?: string
): ResponsePromise<EmptyResponse> {
  return request<EmptyResponse>(DELETE, `/dataFiles/${runId}/images`, config, {
    userNotes,
  })
}
