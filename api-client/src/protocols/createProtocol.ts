import { POST, request } from '../request'
import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { Protocol } from './types'

export function createProtocol(
  config: HostConfig,
  files: File[]
): ResponsePromise<Protocol> {
  return request<Protocol, { files: File[] }>(
    POST,
    '/protocols',
    { files },
    config
  )
}
