import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { EapOptionsResponse } from './types'

export function getEapOptions(
  config: HostConfig
): ResponsePromise<EapOptionsResponse> {
  return request<EapOptionsResponse>(GET, '/wifi/eap-options', config)
}
