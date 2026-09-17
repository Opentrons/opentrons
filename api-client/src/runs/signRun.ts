import { PATCH, request } from '../request'

import type { ResponsePromise } from '../request'
import type { EmptyResponse, HostConfig } from '../types'

export function signRun(
  config: HostConfig,
  runId: string,
  name: string,
  userNotes: string
): ResponsePromise<EmptyResponse> {
  return request<EmptyResponse, { data: { signedBy: string } }>(
    PATCH,
    `/runs/${runId}`,
    config,
    { body: { data: { signedBy: name } }, userNotes }
  )
}
