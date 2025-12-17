import { createAxiosConfig, POST, request } from '../request'

import type { AxiosRequestConfig } from 'axios'
import type {
  CameraImageSettings,
  DownloadedPreviewImageFileResponse,
} from '../camera'
import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'

export function createCapturePreviewImage(
  config: HostConfig,
  data: CameraImageSettings,
  axiosConfig?: AxiosRequestConfig
): ResponsePromise<DownloadedPreviewImageFileResponse> {
  return request<
    DownloadedPreviewImageFileResponse,
    { data: CameraImageSettings }
  >(
    POST,
    `/camera/capturePreviewImage`,
    { data },
    config,
    axiosConfig && createAxiosConfig(axiosConfig)
  )
}
