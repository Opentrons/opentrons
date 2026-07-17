import { PATCH, request } from '../../request'

import type { ResponsePromise } from '../../request'
import type { HostConfig } from '../../types'
import type { AuditSettingsResponse, PatchAuditSettingsRequest } from './types'

export function patchAuditSettings(
  config: HostConfig,
  body: PatchAuditSettingsRequest
): ResponsePromise<AuditSettingsResponse> {
  return request<AuditSettingsResponse, PatchAuditSettingsRequest>(
    PATCH,
    '/audit/external/settings',
    config,
    { body }
  )
}
