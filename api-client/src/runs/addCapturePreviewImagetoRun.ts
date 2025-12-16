import { createAxiosConfig, POST, request } from '../request'

import type { AxiosRequestConfig } from 'axios'
import type {
  CameraImageSettings,
  DownloadedPreviewImageFileResponse,
} from '../camera'
import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'

export function addCapturePreviewImageToRun(
  config: HostConfig,
  data: CameraImageSettings,
  runId: string,
  axiosConfig?: AxiosRequestConfig
): ResponsePromise<DownloadedPreviewImageFileResponse> {
  return request<
    DownloadedPreviewImageFileResponse,
    { data: CameraImageSettings }
  >(
    POST,
    `/runs/${runId}/camera/capturePreviewImage`,
    { data },
    config,
    axiosConfig && createAxiosConfig(axiosConfig)
  )
}
