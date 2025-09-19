import { GET, request } from '../../request'

import type { ResponsePromise } from '../../request'
import type { HostConfig } from '../../types'
import type { ErrorRecoverySettingsResponse } from './types'

export function getErrorRecoverySettings(
  config: HostConfig
): ResponsePromise<ErrorRecoverySettingsResponse> {
  return request<ErrorRecoverySettingsResponse>(
    GET,
    '/errorRecovery/settings',
    null,
    config
  )
}
