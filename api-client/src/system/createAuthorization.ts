import { POST, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { AuthorizationToken, RegistrationToken } from './types'

export function createAuthorization(
  config: HostConfig,
  registrationToken: RegistrationToken
): ResponsePromise<AuthorizationToken> {
  return request<AuthorizationToken>(POST, '/system/authorize', null, {
    ...config,
    ...registrationToken,
  })
}
