import { PATCH, request } from '../../../request'

import type { ResponsePromise } from '../../../request'
import type { HostConfig } from '../../../types'
import type {
  AccessControlAppSettingsResponse,
  PatchAppAccessControlSettingsRequest,
} from './types'

export function patchAppAccessControlSettings(
  config: HostConfig,
  body: PatchAppAccessControlSettingsRequest
): ResponsePromise<AccessControlAppSettingsResponse> {
  return request<
    AccessControlAppSettingsResponse,
    PatchAppAccessControlSettingsRequest
  >(PATCH, '/accessControl/settings', config, { body })
}
