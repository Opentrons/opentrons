import { GET, request } from '../../request'

import type { ResponsePromise } from '../../request'
import type { HostConfig } from '../../types'
import type { AuthUserResponse } from './types'

export function getSelf(config: HostConfig): ResponsePromise<AuthUserResponse> {
  return request<AuthUserResponse>(GET, `/auth/users/self`, config)
}
