import { POST, request } from '../request'

import type { ResponsePromise } from '../request'
import type {
  RunTimeParameterFilesCreateData,
  RunTimeParameterValuesCreateData,
} from '../runs'
import type { HostConfig } from '../types'
import type { Protocol } from './types'

export function createProtocol(
  config: HostConfig,
  files: File[],
  protocolKey?: string,
  protocolKind?: string,
  runTimeParameterValues?: RunTimeParameterValuesCreateData,
  runTimeParameterFiles?: RunTimeParameterFilesCreateData,
  userNotes?: string
): ResponsePromise<Protocol> {
  const formData = new FormData()
  files.forEach(file => {
    formData.append('files', file, file.name)
  })
  if (protocolKind != null) {
    formData.append('protocolKind', protocolKind)
  }
  if (protocolKey != null) {
    formData.append('key', protocolKey)
  }
  if (runTimeParameterValues != null) {
    formData.append(
      'runTimeParameterValues',
      JSON.stringify(runTimeParameterValues)
    )
  }
  if (runTimeParameterFiles != null) {
    formData.append(
      'runTimeParameterFiles',
      JSON.stringify(runTimeParameterFiles)
    )
  }

  return request<Protocol, FormData>(POST, '/protocols', config, {
    body: formData,
    userNotes,
  })
}
