import { POST, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { WifiDisconnectRequest, WifiDisconnectResponse } from './types'

export function postWifiDisconnect(
  config: HostConfig,
  data: WifiDisconnectRequest
): ResponsePromise<WifiDisconnectResponse> {
  return request<WifiDisconnectResponse, WifiDisconnectRequest>(
    POST,
    '/wifi/disconnect',
    config,
    { body: data }
  )
}
