import { GET, request } from '../../request'

import type { ResponsePromise } from '../../request'
import type { HostConfig } from '../../types'
import type { RobotServerAccessControlSettingsResponse } from './types'

export function getRobotServerAccessControlSettings(
  config: HostConfig
): ResponsePromise<RobotServerAccessControlSettingsResponse> {
  return request<RobotServerAccessControlSettingsResponse>(
    GET,
    '/accessControl/settings',
    config
  )
}
