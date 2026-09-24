import { PATCH, request } from '../../request'

import type { ResponsePromise } from '../../request'
import type { HostConfig } from '../../types'
import type { AuthUserResponse, UpdateSelfRequest } from './types'

export function updateSelf(
  config: HostConfig,
  body: UpdateSelfRequest,
  userNotes: string
): ResponsePromise<AuthUserResponse> {
  return request<AuthUserResponse, UpdateSelfRequest>(
    PATCH,
    '/auth/users/self',
    config,
    {
      body,
      userNotes,
      requiresSecureTransport: true, // Might be sending a new password.
    }
  )
}
