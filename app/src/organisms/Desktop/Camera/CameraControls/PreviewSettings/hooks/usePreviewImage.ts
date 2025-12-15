import { useState } from 'react'

import { useCapturePreviewImage } from '@opentrons/react-api-client'

import type { CameraImageSettings } from '@opentrons/api-client'

export interface UsePreviewImageResult {
  imgPath: string | undefined
  isLoading: boolean
  takePhoto: () => void
}

export function usePreviewImage(
  settings: CameraImageSettings
): UsePreviewImageResult {
  const [imgPath, setImgPath] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)

  const { mutate: captureImage } = useCapturePreviewImage({
    onSuccess: response => {
      setIsLoading(false)
    },
    onError: error => {
      console.error('Failed to capture preview image', error)
      setIsLoading(false)
    },
  })

  const takePhoto = (): void => {
    captureImage(settings)
    setTimeout(() => {
      setImgPath(imgPath)
      setIsLoading(false)
    }, 3000)
  }

  return { imgPath, isLoading, takePhoto }
}
