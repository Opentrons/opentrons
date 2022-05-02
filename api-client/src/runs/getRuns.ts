import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { Runs } from './types'

export function getRuns(config: HostConfig): ResponsePromise<Runs> {
  return request<Runs>(GET, `/runs`, null, config)
}
