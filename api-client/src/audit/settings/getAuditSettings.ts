import { GET, request } from '../../request'

import type { ResponsePromise } from '../../request'
import type { HostConfig } from '../../types'
import type { AuditSettingsResponse } from './types'

export function getAuditSettings(
  config: HostConfig
): ResponsePromise<AuditSettingsResponse> {
  return request<AuditSettingsResponse>(GET, '/audit/external/settings', config)
}
