import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { WifiKeysResponse } from './types'

export function getWifiKeys(
  config: HostConfig
): ResponsePromise<WifiKeysResponse> {
  return request<WifiKeysResponse>(GET, '/wifi/keys', config)
}
