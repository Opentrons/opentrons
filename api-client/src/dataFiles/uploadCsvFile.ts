import { POST, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { FileData, UploadedCsvFileResponse } from './types'

export function uploadCsvFile(
  config: HostConfig,
  data: FileData
): ResponsePromise<UploadedCsvFileResponse> {
  return request<UploadedCsvFileResponse>(
    POST,
    '/dataFiles',
    null,
    config,
    data
  )
}
