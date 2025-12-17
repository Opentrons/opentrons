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
  const { createCapturePreviewImage } = useCapturePreviewImage()
  const { createCapturePreviewImageToRun } = useCapturePreviewImageToRun(
    runId ?? ''
  )

  const captureImage =
    runId == null ? createCapturePreviewImage : createCapturePreviewImageToRun

  const takePhoto = (): void => {
    captureImage(
      {
        zoom: settings.zoom,
        brightness: settings.brightness,
        contrast: settings.contrast,
        saturation: settings.saturation,
      },
      { ...callbacks }
    )
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
    isLoading: captureImage.isLoading,
    takePhoto,
  }
}
