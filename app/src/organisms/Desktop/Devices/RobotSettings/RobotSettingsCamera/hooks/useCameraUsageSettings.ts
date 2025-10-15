import { useEffect, useState } from 'react'

import { useCamera, useUpdateCamera } from '@opentrons/react-api-client'

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

// general camera usage settings.
export function useCameraUsageSettings(): UseCameraUsageSettingsResult {
  const { data: cameraData } = useCamera()
  const { mutateAsync: updateCamera } = useUpdateCamera()

  const [isCameraEnabled, setIsCameraEnabled] = useState(true)
  const [isLiveVideoEnabled, setIsLiveVideoEnabled] = useState(true)
  const [isRecoveryCaptureEnabled, setIsRecoveryCaptureEnabled] = useState(true)

  useEffect(() => {
    if (cameraData) {
      setIsCameraEnabled(cameraData?.cameraEnabled ?? true)
      setIsLiveVideoEnabled(cameraData?.liveStreamEnabled ?? true)
      setIsRecoveryCaptureEnabled(
        cameraData?.errorRecoveryCameraEnabled ?? true
      )
    }
  }, [cameraData])

  const toggleCameraEnabled = async (): Promise<void> => {
    console.log('🚀 ~ toggleCameraEnabled 1 ~ newValue:', !isCameraEnabled)
    const newValue = isCameraEnabled
    setIsCameraEnabled(newValue)
    try {
      await updateCamera({
        cameraEnabled: !newValue,
        errorRecoveryCameraEnabled:
          cameraData?.errorRecoveryCameraEnabled ?? true,
        liveStreamEnabled: cameraData?.liveStreamEnabled ?? true,
      })
    } catch (e) {
      setIsCameraEnabled(!newValue)
    }
    console.log('🚀 ~ toggleCameraEnabled 2 ~ newValue:', newValue)
  }

  const toggleLiveVideoEnabled = async (): Promise<void> => {
    console.log(
      '🚀 ~ toggleLiveVideoEnabled ~ isLiveVideoEnabled:',
      isLiveVideoEnabled
    )
    const newValue = isLiveVideoEnabled
    setIsLiveVideoEnabled(newValue)
    try {
      await updateCamera({
        cameraEnabled: cameraData?.cameraEnabled ?? true,
        errorRecoveryCameraEnabled:
          cameraData?.errorRecoveryCameraEnabled ?? true,
        liveStreamEnabled: !newValue,
      })
    } catch (e) {
      setIsLiveVideoEnabled(!newValue)
      console.log('🚀 ~ toggleLiveVideoEnabled ~ newValue:', newValue)
    }
  }

  const toggleRecoveryCaptureEnabled = async (): Promise<void> => {
    const newValue = isRecoveryCaptureEnabled
    console.log(
      '🚀 ~ toggleRecoveryCaptureEnabled ~ isRecoveryCaptureEnabled:',
      isRecoveryCaptureEnabled
    )
    setIsRecoveryCaptureEnabled(newValue)
    try {
      await updateCamera({
        cameraEnabled: cameraData?.cameraEnabled ?? true,
        errorRecoveryCameraEnabled: !newValue,
        liveStreamEnabled: cameraData?.liveStreamEnabled ?? true,
      })
    } catch (e) {
      setIsRecoveryCaptureEnabled(!newValue)
      console.log('🚀 ~ toggleRecoveryCaptureEnabled ~ newValue:', newValue)
    }
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
