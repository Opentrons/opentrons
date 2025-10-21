import { PATCH, request } from '../../request'

import type { ResponsePromise } from '../../request'
import type { HostConfig } from '../../types'
import type {
  ErrorRecoverySettingsRequest,
  ErrorRecoverySettingsResponse,
} from './types'

export function updateErrorRecoverySettings(
  config: HostConfig,
  settings: ErrorRecoverySettingsRequest
): ResponsePromise<ErrorRecoverySettingsResponse> {
  return request<ErrorRecoverySettingsResponse, ErrorRecoverySettingsRequest>(
    PATCH,
    '/errorRecovery/settings',
    settings,
    config
  )
}
