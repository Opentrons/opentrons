import { createRequestConfig, POST, request } from '../request'

import type {
  CameraImageSettings,
  DownloadedPreviewImageFileResponse,
} from '../camera'
import type { HttpRequestConfig, ResponsePromise } from '../request'
import type { HostConfig } from '../types'

export function addCapturePreviewImageToRun(
  config: HostConfig,
  runId: string,
  data: CameraImageSettings,
  requestConfig?: HttpRequestConfig
): ResponsePromise<DownloadedPreviewImageFileResponse> {
  return request<
    DownloadedPreviewImageFileResponse,
    { data: CameraImageSettings }
  >(
    POST,
    `/runs/${runId}/camera/capturePreviewImage`,
    { data },
    config,
    requestConfig && createRequestConfig(requestConfig)
  )
}
