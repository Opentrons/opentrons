import { GET, request } from '../../../request'

import type { ResponsePromise } from '../../../request'
import type { HostConfig } from '../../../types'
import type { AccessControlAppSettingsResponse } from './types'

export function getAccessControlSettings(
  config: HostConfig
): ResponsePromise<AccessControlAppSettingsResponse> {
  return request<AccessControlAppSettingsResponse>(
    GET,
    '/accessControl/settings',
    config
  )
}
