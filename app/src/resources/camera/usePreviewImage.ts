import { useEffect, useMemo, useState } from 'react'

import {
  useCapturePreviewImage,
  useCapturePreviewImageToRun,
} from '@opentrons/react-api-client'

import type { CameraImageSettings } from '@opentrons/api-client'

export interface UsePreviewImageResult {
  imgPath: string | undefined
  isLoading: boolean
  photoTaken: () => Promise<void>
}

export function usePreviewImage(
  settings: CameraImageSettings,
  runId: string | null
): UsePreviewImageResult {
  const [imageBlob, setImageBlob] = useState<Blob | null>(null)

  const captureImagePreview = useCapturePreviewImage()
  const captureImagePreviewForRun = useCapturePreviewImageToRun()

  const captureImage =
    runId == null ? captureImagePreview : captureImagePreviewForRun

  const photoTaken = async (): Promise<void> => {
    const blob = await captureImage.mutateAsync({
      settings,
      runId: runId ?? '',
    })

    setImageBlob(blob)
  }

  const imgPath = useMemo((): string | undefined => {
    if (imageBlob == null) return undefined

    return URL.createObjectURL(imageBlob)
  }, [imageBlob])

  useEffect(() => {
    return () => {
      if (imgPath != undefined) {
        URL.revokeObjectURL(imgPath)
      }
    }
  }, [imgPath])

  return {
    imgPath,
    isLoading: captureImage.isLoading,
    photoTaken,
  }
}
