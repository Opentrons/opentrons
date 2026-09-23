import { PATCH, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { Run } from './types'

export function signRun(
  config: HostConfig,
  runId: string,
  name: string,
  userNotes: string
): ResponsePromise<Run> {
  return request<Run, { data: { signedBy: string } }>(
    PATCH,
    `/runs/${runId}`,
    config,
    { body: { data: { signedBy: name } }, userNotes }
  )
}
