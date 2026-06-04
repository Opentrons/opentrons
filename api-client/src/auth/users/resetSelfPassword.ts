import { POST, request } from '../../request'

import type { ResponsePromise } from '../../request'
import type { HostConfig } from '../../types'
import type { AuthUserResponse, ResetSelfPasswordRequest } from './types'

export function resetSelfPassword(
  config: HostConfig,
  body: ResetSelfPasswordRequest
): ResponsePromise<AuthUserResponse> {
  return request<AuthUserResponse, ResetSelfPasswordRequest>(
    POST,
    '/auth/users/self/resetPassword',
    body,
    config
  )
}
