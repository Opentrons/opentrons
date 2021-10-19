import { POST, request } from '../request'
import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { Protocol } from './types'

export function createProtocol(
  config: HostConfig,
  protocolFiles: File[]
): ResponsePromise<Protocol> {
  return request<Protocol, { protocolFiles: File[] }>(
    POST,
    '/protocols',
    { protocolFiles },
    config
  )
}
