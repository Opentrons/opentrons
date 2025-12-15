import { useMemo } from 'react'

import { useCapturePreviewImage } from '@opentrons/react-api-client'

import { MIME_TYPES } from '../dataFiles/constants'

import type { CameraImageSettings } from '@opentrons/api-client'

export interface UsePreviewImageResult {
  imgPath: string | undefined
  isLoading: boolean
  takePhoto: () => void
}

export function usePreviewImage(
  settings: CameraImageSettings
): UsePreviewImageResult {
  const { data, refetch, isFetching } = useCapturePreviewImage(settings, {
    responseType: 'blob',
  })

  const imgPath = useMemo(() => {
    if (data == null) return undefined

    const blob = new Blob([data], { type: MIME_TYPES.IMAGE })
    return URL.createObjectURL(blob)
  }, [data])

  const takePhoto = (): void => {
    refetch()
  }

  return {
    imgPath,
    isLoading: isFetching,
    takePhoto,
  }
}
