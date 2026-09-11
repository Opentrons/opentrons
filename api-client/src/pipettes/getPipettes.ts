import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { GetPipettesParams, Pipettes } from './types'

export function getPipettes(
  config: HostConfig,
  params: GetPipettesParams
): ResponsePromise<Pipettes> {
  return request<Pipettes>(GET, `/pipettes`, config, {
    queryParams: { ...params },
  })
}
