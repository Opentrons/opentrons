import { PATCH, request } from '../../request'

import type { ResponsePromise } from '../../request'
import type { HostConfig } from '../../types'
import type { AuthUserResponse, UpdateSelfPasswordRequest } from './types'

export function updateSelfResetPassword(
  config: HostConfig,
  body: UpdateSelfPasswordRequest
): ResponsePromise<AuthUserResponse> {
  return request<AuthUserResponse, UpdateSelfPasswordRequest>(
    PATCH,
    '/auth/users/self/resetPassword',
    body,
    config
  )
}
