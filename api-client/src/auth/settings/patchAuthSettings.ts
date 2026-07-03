import { PATCH, request } from '../../request'

import type { ResponsePromise } from '../../request'
import type { HostConfig } from '../../types'
import type { AuthSettingsResponse, PatchAuthSettingsRequest } from './types'

export function patchAuthSettings(
  config: HostConfig,
  body: PatchAuthSettingsRequest
): ResponsePromise<AuthSettingsResponse> {
  return request<AuthSettingsResponse, PatchAuthSettingsRequest>(
    PATCH,
    '/auth/settings',
    config,
    { body }
  )
}
