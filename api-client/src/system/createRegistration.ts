import { POST, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { CreateRegistrationParams, RegistrationToken } from './types'

export function createRegistration(
  config: HostConfig,
  params: CreateRegistrationParams
): ResponsePromise<RegistrationToken> {
  return request<RegistrationToken>(
    POST,
    '/system/register',
    null,
    config,
    params
  )
}
