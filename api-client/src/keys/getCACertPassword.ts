import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { CACertPassword } from './types'

export function getCACertPassword(
  config: HostConfig
): ResponsePromise<CACertPassword> {
  return request<CACertPassword>(GET, '/keys/internal/ca/password', config)
}
