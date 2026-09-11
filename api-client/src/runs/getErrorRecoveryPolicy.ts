import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { ErrorRecoveryPolicyResponse } from './types'

export function getErrorRecoveryPolicy(
  config: HostConfig,
  runId: string
): ResponsePromise<ErrorRecoveryPolicyResponse> {
  return request<ErrorRecoveryPolicyResponse>(
    GET,
    `/runs/${runId}/errorRecoveryPolicy`,
    config
  )
}
