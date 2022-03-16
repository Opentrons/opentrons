import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { Protocol } from './types'

export function getProtocol(
  config: HostConfig,
  protocolId: string
): ResponsePromise<Protocol> {
  return request<Protocol>(GET, `/protocols/${protocolId}`, null, config)
}
