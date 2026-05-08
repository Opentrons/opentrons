import { POST, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type {
  CreateRunActionData,
  CreateRunActionRequestBody,
  RunAction,
} from './types'

export function createRunAction(
  config: HostConfig,
  runId: string,
  body: CreateRunActionData | CreateRunActionRequestBody
): ResponsePromise<RunAction> {
  const payload: CreateRunActionRequestBody =
    'data' in body ? body : { data: body }
  return request<RunAction, CreateRunActionRequestBody>(
    POST,
    `/runs/${runId}/actions`,
    payload,
    config
  )
}
