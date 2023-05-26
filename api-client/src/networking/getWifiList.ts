import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { WifiListResponse } from './types'

export function getWifiList(
  config: HostConfig
): ResponsePromise<WifiListResponse> {
  return request<WifiListResponse>(GET, '/wifi/list', null, config)
}
