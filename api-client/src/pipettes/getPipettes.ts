import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { FetchPipettesResponseBody } from './types'

export function getPipettes(
  config: HostConfig
): ResponsePromise<FetchPipettesResponseBody> {
  return request<FetchPipettesResponseBody>(GET, `/pipettes`, null, config)
}
