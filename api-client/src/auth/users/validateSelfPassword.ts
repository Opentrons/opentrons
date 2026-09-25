import { POST, request } from '../../request'

import type { ResponsePromise } from '../../request'
import type { EmptyResponse, HostConfig } from '../../types'
import type { ValidateSelfPasswordRequest } from './types'

export function validateSelfPassword(
  config: HostConfig,
  body: ValidateSelfPasswordRequest
): ResponsePromise<EmptyResponse> {
  return request<EmptyResponse, ValidateSelfPasswordRequest>(
    POST,
    '/auth/users/self/validatePassword',
    config,
    {
      body,
      requiresSecureTransport: true,
    }
  )
}
