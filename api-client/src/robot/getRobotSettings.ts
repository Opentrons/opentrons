import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { RobotSettingsResponse } from './types'

export function getRobotSettings(
  config: HostConfig
): ResponsePromise<RobotSettingsResponse> {
  return request<RobotSettingsResponse>(GET, '/settings', null, config)
}
