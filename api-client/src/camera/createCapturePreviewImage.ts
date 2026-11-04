import { POST, request } from '../request'

import type {
  CameraImageSettings,
  DownloadedPreviewImageFileResponse,
} from '../camera'
import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'

export function createCapturePreviewImage(
  config: HostConfig,
  data: CameraImageSettings,
  userNotes: string
): ResponsePromise<DownloadedPreviewImageFileResponse> {
  return request<
    DownloadedPreviewImageFileResponse,
    { data: CameraImageSettings }
  >(POST, `/camera/capturePreviewImage`, config, {
    body: { data },
    responseType: 'blob',
    userNotes,
  })
}
