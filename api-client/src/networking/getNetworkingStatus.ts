import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { NetworkingStatusResponse } from './types'

export function getNetworkingStatus(
  config: HostConfig
): ResponsePromise<NetworkingStatusResponse> {
  return request<NetworkingStatusResponse>(GET, '/networking/status', config)
}
