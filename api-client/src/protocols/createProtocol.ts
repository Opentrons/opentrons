import { POST, request } from '../request'
import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { Protocol } from './types'

export function createProtocol(
  config: HostConfig,
  files: File[],
  protocolKey?: string
): ResponsePromise<Protocol> {
  const formData = new FormData()
  files.forEach(file => formData.append('files', file, file.name))
  if (protocolKey != null) formData.append('key', protocolKey)

  return request<Protocol, FormData>(POST, '/protocols', formData, config)
}
