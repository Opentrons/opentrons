import { POST, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { RobotSettingsResponse, UpdateRobotSettingRequest } from './types'

export function updateRobotSetting(
  config: HostConfig,
  id: string,
  value: boolean
): ResponsePromise<RobotSettingsResponse> {
  return request<RobotSettingsResponse, UpdateRobotSettingRequest>(
    POST,
    '/settings',
    { id, value },
    config
  )
}
