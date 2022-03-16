import { POST, request } from '../request'
import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { Protocol } from './types'

export function createProtocol(
  config: HostConfig,
  files: File[]
): ResponsePromise<Protocol> {
  const formData = new FormData()
  files.forEach(file => formData.append('files', file, file.name))

  return request<Protocol, FormData>(POST, '/protocols', formData, config)
}
