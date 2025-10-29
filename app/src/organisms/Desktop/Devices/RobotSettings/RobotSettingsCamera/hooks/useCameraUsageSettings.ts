import { useEffect, useState } from 'react'

import { useCamera, useUpdateCamera } from '@opentrons/react-api-client'

import { useCameraAnalytics } from '/app/redux-resources/analytics/'

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

// general camera usage settings.
export function useCameraUsageSettings(): UseCameraUsageSettingsResult {
  const { reportCameraEnablementSettings } = useCameraAnalytics({})
  const { data: cameraData } = useCamera({
    refetchInterval: CAMERA_POLLING_INTERVAL_MS,
  })
  const { mutateAsync: updateCamera } = useUpdateCamera()

  const [isCameraEnabled, setIsCameraEnabled] = useState(true)
  const [isLiveVideoEnabled, setIsLiveVideoEnabled] = useState(true)
  const [isRecoveryCaptureEnabled, setIsRecoveryCaptureEnabled] = useState(true)

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
    reportCameraEnablementSettings({
      enabled: newValue,
      enablementType: 'camera',
    })
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
    reportCameraEnablementSettings({
      enabled: newValue,
      enablementType: 'liveFeed',
    })
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
    reportCameraEnablementSettings({
      enabled: newValue,
      enablementType: 'recoveryCapture',
    })
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
