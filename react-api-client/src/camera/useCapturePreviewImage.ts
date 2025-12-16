import { useQuery } from 'react-query'

import { createCapturePreviewImage } from '@opentrons/api-client'

import { useHost } from '../api'

import type { AxiosError } from 'axios'
import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type {
  CameraImageSettings,
  DownloadedImageFileResponse,
  ErrorResponse,
} from '@opentrons/api-client'

export function useCapturePreviewImage(
  cameraImageSettings: CameraImageSettings,
  options?: UseQueryOptions<
    DownloadedImageFileResponse,
    AxiosError<ErrorResponse>
  >
): UseQueryResult<DownloadedImageFileResponse, AxiosError<ErrorResponse>> {
  const host = useHost()

  return useQuery<DownloadedImageFileResponse, AxiosError<ErrorResponse>>(
    [host, 'camera', 'capturePreviewImage', cameraImageSettings],
    () =>
      createCapturePreviewImage(host!, cameraImageSettings, {
        responseType: 'blob',
      }).then(response => response.data),
    {
      ...options,
    }
  )
}
