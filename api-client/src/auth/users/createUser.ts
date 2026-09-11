import { POST, request } from '../../request'

import type { ResponsePromise } from '../../request'
import type { HostConfig } from '../../types'
import type { CreateUserRequest, CreateUserResponse } from './types'

export function createUser(
  config: HostConfig,
  body: CreateUserRequest,
  userNotes?: string
): ResponsePromise<CreateUserResponse> {
  return request<CreateUserResponse, CreateUserRequest>(
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
