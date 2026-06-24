import { PATCH, request } from '../../../request'

import type { ResponsePromise } from '../../../request'
import type { HostConfig } from '../../../types'
import type {
  AccessControlAppSettingsResponse,
  PatchAccessControlSettingsRequest,
} from './types'

export function patchAccessControlSettings(
  config: HostConfig,
  body: PatchAccessControlSettingsRequest
): ResponsePromise<AccessControlAppSettingsResponse> {
  return request<
    AccessControlAppSettingsResponse,
    PatchAccessControlSettingsRequest
  >(PATCH, '/accessControl/settings', config, { body })
}
