import { createRequestConfig, GET, request } from '../request'

import type { HttpRequestConfig, ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { DownloadedDataFileResponse } from './types'

export function getDataFileRaw(
  config: HostConfig,
  fileId: string,
  requestConfig?: HttpRequestConfig
): ResponsePromise<DownloadedDataFileResponse> {
  return request<DownloadedDataFileResponse>(
    GET,
    `/dataFiles/${fileId}/download`,
    null,
    config,
    requestConfig && createRequestConfig(requestConfig)
  )
}
