import { POST, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { RunAction, RunActionType } from './types'

export interface CreateRunActionData {
  actionType: RunActionType
}

export function createRunAction(
  config: HostConfig,
  data: CreateRunActionData
): ResponsePromise<RunAction> {
  return request<RunAction, { data: CreateRunActionData }>(
    POST,
    '/runs',
    { data },
    config
  )
}
