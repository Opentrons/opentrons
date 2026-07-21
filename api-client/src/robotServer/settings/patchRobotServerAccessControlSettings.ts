import { PATCH, request } from '../../request'

import type { ResponsePromise } from '../../request'
import type { HostConfig } from '../../types'
import type {
  PatchRobotServerAccessControlSettingsRequest,
  RobotServerAccessControlSettingsResponse,
} from './types'

export function patchRobotServerAccessControlSettings(
  config: HostConfig,
  body: PatchRobotServerAccessControlSettingsRequest,
  userNotes: string
): ResponsePromise<RobotServerAccessControlSettingsResponse> {
  return request<
    RobotServerAccessControlSettingsResponse,
    PatchRobotServerAccessControlSettingsRequest
  >(PATCH, '/accessControl/settings', config, { body, userNotes })
}
