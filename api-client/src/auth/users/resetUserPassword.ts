import { POST, request } from '../../request'

import type { ResponsePromise } from '../../request'
import type { HostConfig } from '../../types'
import type { TemporaryPasswordAuthUserResponse } from './types'

export function resetUserPassword(
  config: HostConfig,
  username: string,
  userNotes?: string
): ResponsePromise<TemporaryPasswordAuthUserResponse> {
  return request<TemporaryPasswordAuthUserResponse>(
    POST,
    `/auth/users/byUsername/${encodeURIComponent(username)}/resetPassword`,
    config,
    {
      userNotes,
      requiresSecureTransport: true,
    }
  )
}
