import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { Protocols } from './types'

export function getProtocols(config: HostConfig): ResponsePromise<Protocols> {
  return request<Protocols>(GET, `/protocols`, null, config)
}
