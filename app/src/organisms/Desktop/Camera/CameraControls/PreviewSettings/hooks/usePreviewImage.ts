import { useState } from 'react'

export interface UsePreviewImageResult {
  imgPath: string | undefined
  isLoading: boolean
  takePhoto: () => void
}

export function usePreviewImage(): UsePreviewImageResult {
  const [isLoading, setIsLoading] = useState(false)
  const [imgPath, setImgPath] = useState<string | undefined>(undefined)

  const takePhoto = (): void => {
    setIsLoading(true)

    setTimeout(() => {
      setImgPath(imgPath)
      setIsLoading(false)
    }, 3000)
  }

  return { imgPath, isLoading, takePhoto }
}
