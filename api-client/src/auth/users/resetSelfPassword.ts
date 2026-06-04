import { POST, request } from '../../request'

import type { ResponsePromise } from '../../request'
import type { HostConfig } from '../../types'
import type { AuthUserResponse, UpdateSelfPasswordRequest } from './types'

export function resetSelfPassword(
  config: HostConfig,
  body: UpdateSelfPasswordRequest
): ResponsePromise<AuthUserResponse> {
  return request<AuthUserResponse, UpdateSelfPasswordRequest>(
    POST,
    '/auth/users/self/resetPassword',
    body,
    config
  )
}
