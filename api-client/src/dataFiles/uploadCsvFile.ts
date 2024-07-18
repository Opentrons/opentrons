import { POST, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { FileData, UploadedCsvFileResponse } from './types'

export function uploadCsvFile(
  config: HostConfig,
  data: FileData
): ResponsePromise<UploadedCsvFileResponse> {
  const formData = new FormData()

  if (typeof data !== 'string') {
    formData.append('file', data)
  } else {
    formData.append('filePath', data)
  }
  return request<UploadedCsvFileResponse, FormData>(
    POST,
    '/dataFiles',
    formData,
    config
  )
}
