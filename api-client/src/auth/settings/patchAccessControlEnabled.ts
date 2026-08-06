import { PATCH, request } from '../../request'

import type { ResponsePromise } from '../../request'
import type { HostConfig } from '../../types'
import type {
  AccessControlEnabledSettingsResponse,
  PatchAccessControlEnabledSettingsRequest,
} from './types'

export function patchAccessControlEnabled(
  config: HostConfig,
  body: PatchAccessControlEnabledSettingsRequest
): ResponsePromise<AccessControlEnabledSettingsResponse> {
  return request<
    AccessControlEnabledSettingsResponse,
    PatchAccessControlEnabledSettingsRequest
  >(PATCH, '/auth/settings/accessControlEnabled', config, { body })
}
