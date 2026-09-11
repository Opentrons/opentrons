import { GET, request } from '../../request'

import type { ResponsePromise } from '../../request'
import type { HostConfig } from '../../types'
import type { AuthUsersResponse } from './types'

export function getUsers(
  config: HostConfig
): ResponsePromise<AuthUsersResponse> {
  return request<AuthUsersResponse>(GET, '/auth/users', config)
}
