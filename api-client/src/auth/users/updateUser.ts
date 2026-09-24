import { PATCH, request } from '../../request'

import type { ResponsePromise } from '../../request'
import type { HostConfig } from '../../types'
import type {
  AuthUserResponse,
  UpdateUserParams,
  UpdateUserRequest,
} from './types'

export function updateUser(
  config: HostConfig,
  { username, request: body }: UpdateUserParams,
  userNotes?: string
): ResponsePromise<AuthUserResponse> {
  return request<AuthUserResponse, UpdateUserRequest>(
    PATCH,
    `/auth/users/byUsername/${encodeURIComponent(username)}`,
    config,
    {
      body,
      userNotes,
      requiresSecureTransport: true,
    }
  )
}
