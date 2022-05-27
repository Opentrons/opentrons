import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { Pipettes } from './types'

export function getPipettes(config: HostConfig): ResponsePromise<Pipettes> {
  return request<Pipettes>(GET, `/pipettes`, null, config)
}
