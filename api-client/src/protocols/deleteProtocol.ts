import { DELETE, request } from '../request'

import type { ResponsePromise } from '../request'
import type { EmptyResponse, HostConfig } from '../types'

export function deleteProtocol(
  config: HostConfig,
  protocolId: string,
  userNotes?: string
): ResponsePromise<EmptyResponse> {
  return request<EmptyResponse>(DELETE, `/protocols/${protocolId}`, config, {
    userNotes,
  })
}
