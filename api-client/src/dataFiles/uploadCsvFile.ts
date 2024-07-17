import { POST, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { FileData, UploadedCsvFileResponse } from './types'

export function uploadCsvFile(
  config: HostConfig,
  data: FileData
): ResponsePromise<UploadedCsvFileResponse> {
  let formData

  if (typeof data !== 'string') {
    formData = new FormData()
    formData.append('file', data)
  } else {
    formData = data
  }
  return request<UploadedCsvFileResponse, FormData | string>(
    POST,
    '/dataFiles',
    formData,
    config
  )
}
