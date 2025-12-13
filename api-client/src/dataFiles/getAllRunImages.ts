import { createAxiosConfig, GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { DownloadedImageFileResponse } from './types'

export function getAllRunImages(
  config: HostConfig,
  runId: string
): ResponsePromise<DownloadedImageFileResponse> {
  return request<DownloadedImageFileResponse>(
    GET,
    `/dataFiles/${runId}/images/download`,
    null,
    config,
    createAxiosConfig({ responseType: 'blob' })
  )
}
