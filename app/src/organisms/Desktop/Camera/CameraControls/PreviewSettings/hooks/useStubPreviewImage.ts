import { useState } from 'react'

import stubCameraImage from '/app/organisms/Desktop/Devices/ProtocolRun/ProtocolRunCamera/ImageGalleryContainer/hooks/stubCameraImage.jpg'

export interface UseStubPreviewImageResult {
  imgPath: string | undefined
  isLoading: boolean
  takePhoto: () => void
}

// Stubs the preview image functionality
export function useStubPreviewImage(): UseStubPreviewImageResult {
  const [isLoading, setIsLoading] = useState(false)
  const [imgPath, setImgPath] = useState<string | undefined>(undefined)

  const takePhoto = (): void => {
    setIsLoading(true)

    setTimeout(() => {
      setImgPath(stubCameraImage)
      setIsLoading(false)
    }, 3000)
  }

  return { imgPath, isLoading, takePhoto }
}
