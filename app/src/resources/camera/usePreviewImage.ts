import { useEffect, useMemo, useState } from 'react'

import {
  useCapturePreviewImage,
  useCapturePreviewImageToRun,
} from '@opentrons/react-api-client'

import type { CameraImageSettings } from '@opentrons/api-client'

export interface UsePreviewImageResult {
  imgPath: string | null
  isLoading: boolean
  takePhoto: () => void
}

export function usePreviewImage(
  settings: CameraImageSettings,
  runId: string | null
): UsePreviewImageResult {
  const [imageBlob, setImageBlob] = useState<Blob | null>(null)
  const callbacks = {
    onSettled: (blob?: Blob) => {
      if (blob != null) {
        setImageBlob(blob)
      }
    },
    onError: (error: unknown) => {
      console.error('Failed to capture preview image', error)
    },
  }
  const capturePreviewImage = useCapturePreviewImage()
  const capturePreviewImageToRun = useCapturePreviewImageToRun(runId ?? '')

  const takePhoto = (): void => {
    if (runId == null) {
      capturePreviewImage.createCapturePreviewImage({ settings }, callbacks)
    } else {
      capturePreviewImageToRun.createCapturePreviewImageToRun(
        { runId, settings },
        callbacks
      )
    }
  }

  const imgPath = useMemo((): string | null => {
    if (imageBlob == null) {
      return null
    }

    return URL.createObjectURL(imageBlob)
  }, [imageBlob])

  useEffect(() => {
    return () => {
      if (imgPath !== null) {
        URL.revokeObjectURL(imgPath)
      }
    }
  }, [imgPath])

  return {
    imgPath,
    isLoading:
      runId == null
        ? capturePreviewImage.isLoading
        : capturePreviewImageToRun.isLoading,
    takePhoto,
  }
}
