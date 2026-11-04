import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { ResetConfigOptionsResponse } from './types'

export function getResetConfigOptions(
  config: HostConfig
): ResponsePromise<ResetConfigOptionsResponse> {
  return request<ResetConfigOptionsResponse>(
    GET,
    '/settings/reset/options',
    config
  )
}
