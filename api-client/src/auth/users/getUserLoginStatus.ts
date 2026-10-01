import { GET, request } from '../../request'

import type { ResponsePromise } from '../../request'
import type { HostConfig } from '../../types'
import type { UserLoginStatusResponse } from './types'

export function getUserLoginStatus(
  config: HostConfig,
  username: string
): ResponsePromise<UserLoginStatusResponse> {
  return request<UserLoginStatusResponse>(
    GET,
    `/auth/users/byUsername/${encodeURIComponent(username)}/loginStatus`,
    config
  )
}
