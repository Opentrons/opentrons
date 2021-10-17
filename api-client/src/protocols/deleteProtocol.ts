import { DELETE, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { Protocol } from './types'

export function deleteProtocol(
  config: HostConfig,
  protocolId: string
): ResponsePromise<Protocol> {
  return request<Protocol>(DELETE, `/protocols/${protocolId}`, null, config)
}
