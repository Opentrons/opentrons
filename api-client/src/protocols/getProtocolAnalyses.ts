import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { ProtocolAnalyses } from './types'

export function getProtocolAnalyses(
  config: HostConfig,
  protocolId: string
): ResponsePromise<ProtocolAnalyses> {
  return request<ProtocolAnalyses>(
    GET,
    `/protocols/${protocolId}/analyses`,
    null,
    config
  )
}
