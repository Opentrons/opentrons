import { useEffect, useState } from 'react'

import { useUpdateCamera } from '@opentrons/react-api-client'

import { useNotifyCamera } from '/app/resources/camera/useNotifyCamera'

import type { DocumentationState } from '@opentrons/react-api-client'

const CAMERA_POLLING_INTERVAL_MS = 5000

export interface UseCameraUsageSettingsResult {
  /* Whether the camera is generally enabled. No other settings
   * are configurable if this setting is false. */
  isCameraEnabled: boolean
  isLiveVideoEnabled: boolean
  isRecoveryCaptureEnabled: boolean
  toggleCameraEnabled: () => void
  toggleLiveVideoEnabled: () => void
  toggleRecoveryCaptureEnabled: () => void
}

// general camera usage settings. intended for out of run setup use only.
export function useCameraUsageSettings(
  documentationState: DocumentationState
): UseCameraUsageSettingsResult {
  const { data: cameraData } = useNotifyCamera({
    refetchInterval: CAMERA_POLLING_INTERVAL_MS,
  })
  const { mutateAsync: updateCamera } = useUpdateCamera(documentationState)

  const [isCameraEnabled, setIsCameraEnabled] = useState(false)
  const [isLiveVideoEnabled, setIsLiveVideoEnabled] = useState(false)
  const [isRecoveryCaptureEnabled, setIsRecoveryCaptureEnabled] =
    useState(false)

  useEffect(() => {
    if (cameraData) {
      setIsCameraEnabled(cameraData?.cameraEnabled)
      setIsLiveVideoEnabled(cameraData?.liveStreamEnabled)
      setIsRecoveryCaptureEnabled(cameraData?.errorRecoveryCameraEnabled)
    }
  }, [cameraData])

  const toggleCameraEnabled = (): void => {
    const newValue = !isCameraEnabled
    setIsCameraEnabled(newValue)
    void updateCamera(
      {
        cameraEnabled: newValue,
        errorRecoveryCameraEnabled: isRecoveryCaptureEnabled,
        liveStreamEnabled: isLiveVideoEnabled,
      },
      {
        onError: () => {
          setIsCameraEnabled(!newValue)
        },
      }
    )
  }

  const toggleLiveVideoEnabled = (): void => {
    const newValue = !isLiveVideoEnabled
    setIsLiveVideoEnabled(newValue)
    void updateCamera(
      {
        cameraEnabled: isCameraEnabled,
        errorRecoveryCameraEnabled: isRecoveryCaptureEnabled,
        liveStreamEnabled: newValue,
      },
      {
        onError: () => {
          setIsLiveVideoEnabled(!newValue)
        },
      }
    )
  }

  const toggleRecoveryCaptureEnabled = (): void => {
    const newValue = !isRecoveryCaptureEnabled
    setIsRecoveryCaptureEnabled(newValue)

    void updateCamera(
      {
        cameraEnabled: isCameraEnabled,
        errorRecoveryCameraEnabled: newValue,
        liveStreamEnabled: isLiveVideoEnabled,
      },
      {
        onError: () => {
          setIsRecoveryCaptureEnabled(!newValue)
        },
      }
    )
  }

  return {
    isCameraEnabled,
    isLiveVideoEnabled,
    isRecoveryCaptureEnabled,
    toggleCameraEnabled,
    toggleLiveVideoEnabled,
    toggleRecoveryCaptureEnabled,
  }
}
