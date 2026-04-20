import { createRequestConfig, POST, request } from '../request'

import type {
  CameraImageSettings,
  DownloadedPreviewImageFileResponse,
} from '../camera'
import type { HttpRequestConfig, ResponsePromise } from '../request'
import type { HostConfig } from '../types'

export function createCapturePreviewImage(
  config: HostConfig,
  data: CameraImageSettings,
  requestConfig?: HttpRequestConfig
): ResponsePromise<DownloadedPreviewImageFileResponse> {
  return request<
    DownloadedPreviewImageFileResponse,
    { data: CameraImageSettings }
  >(
    POST,
    `/camera/capturePreviewImage`,
    { data },
    config,
    requestConfig && createRequestConfig(requestConfig)
  )
}
