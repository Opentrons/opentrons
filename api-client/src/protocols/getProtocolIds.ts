import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { ProtocolsIds } from './types'

export function getProtocolIds(
  config: HostConfig
): ResponsePromise<ProtocolsIds> {
  return request<ProtocolsIds>(GET, `/protocols/ids`, null, config)
}
