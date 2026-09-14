import { POST, request } from '../request'

import type {
  CameraImageSettings,
  DownloadedPreviewImageFileResponse,
} from '../camera'
import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'

export function addCapturePreviewImageToRun(
  config: HostConfig,
  runId: string,
  data: CameraImageSettings,
  userNotes: string
): ResponsePromise<DownloadedPreviewImageFileResponse> {
  return request<
    DownloadedPreviewImageFileResponse,
    { data: CameraImageSettings }
  >(POST, `/runs/${runId}/camera/capturePreviewImage`, config, {
    body: { data },
    responseType: 'blob',
    userNotes,
  })
}
