import { PATCH, request } from '../../request'

import type { ResponsePromise } from '../../request'
import type { HostConfig } from '../../types'
import type {
  PatchAuthSettingsRequest,
  PatchAuthSettingsResponse,
} from './types'

export function patchAuthSettings(
  config: HostConfig,
  body: PatchAuthSettingsRequest,
  userNotes: string
): ResponsePromise<PatchAuthSettingsResponse> {
  return request<PatchAuthSettingsResponse, PatchAuthSettingsRequest>(
    PATCH,
    '/auth/settings',
    config,
    { body, userNotes }
  )
}
