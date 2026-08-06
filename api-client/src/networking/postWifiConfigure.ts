import { POST, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { WifiConfigureRequest, WifiConfigureResponse } from './types'

export function postWifiConfigure(
  config: HostConfig,
  options: WifiConfigureRequest,
  userNotes: string
): ResponsePromise<WifiConfigureResponse> {
  return request<WifiConfigureResponse, WifiConfigureRequest>(
    POST,
    '/wifi/configure',
    config,
    { body: options, userNotes }
  )
}
