import { GET, request } from '../../request'

import type { ResponsePromise } from '../../request'
import type { HostConfig } from '../../types'
import type { AccessControlEnabledSettingsResponse } from './types'

export function getAccessControlEnabled(
  config: HostConfig
): ResponsePromise<AccessControlEnabledSettingsResponse> {
  return request<AccessControlEnabledSettingsResponse>(
    GET,
    '/auth/settings/accessControlEnabled',
    config
  )
}
