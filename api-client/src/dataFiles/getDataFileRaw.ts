import { GET, request } from '../request'

import type { AxiosRequestConfig } from 'axios'
import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { DownloadedDataFileResponse } from './types'

export function getDataFileRaw(
  config: HostConfig,
  fileId: string,
  axiosConfig?: AxiosRequestConfig
): ResponsePromise<DownloadedDataFileResponse> {
  return request<DownloadedDataFileResponse>(
    GET,
    `/dataFiles/${fileId}/download`,
    null,
    config,
    axiosConfig
  )
}
