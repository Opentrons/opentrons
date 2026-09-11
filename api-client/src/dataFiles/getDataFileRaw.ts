import { GET, request } from '../request'

import type { RequestConfig, ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { DownloadedDataFileResponse } from './types'

export function getDataFileRaw(
  config: HostConfig,
  fileId: string,
  responseType?: RequestConfig<unknown>['responseType']
): ResponsePromise<DownloadedDataFileResponse> {
  return request<DownloadedDataFileResponse>(
    GET,
    `/dataFiles/${fileId}/download`,
    config,
    { responseType }
  )
}
