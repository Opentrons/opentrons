import { POST, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { ResetConfigResponse, SettingsResets } from './types'

export function postResetConfig(
  config: HostConfig,
  settingsResets: SettingsResets,
  userNotes?: string
): ResponsePromise<ResetConfigResponse> {
  return request<ResetConfigResponse, SettingsResets>(
    POST,
    '/settings/reset',
    config,
    { body: settingsResets, userNotes }
  )
}
