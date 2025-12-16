import { useQuery } from 'react-query'

import { addCapturePreviewImageToRun } from '@opentrons/api-client'

import { useHost } from '../api'

import type { AxiosError } from 'axios'
import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type {
  CameraImageSettings,
  DownloadedImageFileResponse,
  ErrorResponse,
} from '@opentrons/api-client'

export function useAddCapturePreviewImageToRun(
  cameraImageSettings: CameraImageSettings,
  runId: string,
  options?: UseQueryOptions<
    DownloadedImageFileResponse,
    AxiosError<ErrorResponse>
  >
): UseQueryResult<DownloadedImageFileResponse, AxiosError<ErrorResponse>> {
  const host = useHost()

  return useQuery<DownloadedImageFileResponse, AxiosError<ErrorResponse>>(
    [host, 'runs', runId, 'camera', 'capturePreviewImage', cameraImageSettings],
    () =>
      addCapturePreviewImageToRun(host!, cameraImageSettings, runId, {
        responseType: 'blob',
      }).then(response => response.data),
    {
      ...options,
    }
  )
}