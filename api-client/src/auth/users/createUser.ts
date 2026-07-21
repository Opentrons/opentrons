import { POST, request } from '../../request'

import type { ResponsePromise } from '../../request'
import type { HostConfig } from '../../types'
import type { AuthUserResponse, CreateUserRequest } from './types'

export function createUser(
  config: HostConfig,
  body: CreateUserRequest,
  userNotes?: string
): ResponsePromise<AuthUserResponse> {
  return request<AuthUserResponse, CreateUserRequest>(
    POST,
    '/auth/users',
    config,
    {
      body,
      requiresSecureTransport: true,
      userNotes,
    }
  )
}
