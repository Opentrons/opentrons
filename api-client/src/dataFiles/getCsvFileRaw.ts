import { GET, request } from '../request'

import type { DownloadedCsvFileResponse } from './types'
import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'

export function getCsvFileRaw(
  config: HostConfig,
  fileId: string
): ResponsePromise<DownloadedCsvFileResponse> {
  return request<DownloadedCsvFileResponse>(
    GET,
    `/dataFiles/${fileId}/download`,
    null,
    config
  )
}
