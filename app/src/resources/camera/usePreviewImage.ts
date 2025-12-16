import { useMemo, useState } from 'react'

import {
  useAddCapturePreviewImageToRun,
  useCapturePreviewImage,
} from '@opentrons/react-api-client'

import { MIME_TYPES } from '../dataFiles/constants'

import type { CameraImageSettings } from '@opentrons/api-client'

export interface UsePreviewImageResult {
  imgPath: string | undefined
  isLoading: boolean
  takePhoto: () => void
}

export function usePreviewImage(
  settings: CameraImageSettings,
  runId: string | null
): UsePreviewImageResult {
  const [isLoading, setIsLoading] = useState(false)

  const previewQuery = useCapturePreviewImage(settings, {
    enabled: runId == null,
    onSettled: () => {
      setIsLoading(false)
    },
    onError: error => {
      console.error('Failed to capture preview image', error)
    },
  })
  console.log('🚀 ~ usePreviewImage ~ previewQuery:', previewQuery)

  const previewWithRunQuery = useAddCapturePreviewImageToRun(
    settings,
    runId ?? '',
    {
      enabled: runId != null,
      onSettled: () => {
        setIsLoading(false)
      },
      onError: error => {
        console.error(`Failed to capture preview image in run ${runId}`, error)
      },
    }
  )

  const { data, refetch } = runId == null ? previewQuery : previewWithRunQuery
  const imgPath = useMemo(() => {
    if (data == null) {
      return undefined
    } else {
      const blob = new Blob([data], { type: MIME_TYPES.IMAGE })
      return URL.createObjectURL(blob)
    }
  }, [data])

  const takePhoto = (): void => {
    refetch()
  }

  return {
    imgPath,
    isLoading,
    takePhoto,
  }
}
