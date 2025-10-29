import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { DownloadedDataFileResponse } from './types'

export function getDataFileRaw(
  config: HostConfig,
  fileId: string
): ResponsePromise<DownloadedDataFileResponse> {
  return request<DownloadedDataFileResponse>(
    GET,
    `/dataFiles/${fileId}/download`,
    null,
    config
  )
}
