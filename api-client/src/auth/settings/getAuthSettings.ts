import { GET, request } from '../../request'

import type { ResponsePromise } from '../../request'
import type { HostConfig } from '../../types'
import type { AuthSettingsResponse } from './types'

export function getAuthSettings(
  config: HostConfig
): ResponsePromise<AuthSettingsResponse> {
  return request<AuthSettingsResponse>(GET, '/auth/settings', null, config)
}
