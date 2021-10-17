import type { JsonProtocolFile, ProtocolFileV3 } from '@opentrons/shared-data'
import { POST, request } from '../request'
import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { Protocol } from './types'

export function createProtocol(
  config: HostConfig,
  protocolFile: JsonProtocolFile | ProtocolFileV3
): ResponsePromise<Protocol> {
  return request<Protocol, { protocolFile: JsonProtocolFile | ProtocolFileV3 }>(
    POST,
    '/protocols',
    { protocolFile },
    config
  )
}
