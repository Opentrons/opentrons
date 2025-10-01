import { useState } from 'react'

export interface UseStubCameraUsageSettingsResult {
  /* Whether the camera is generally enabled. No other settings
   * are configurable if this setting is false. */
  isCameraEnabled: boolean
  isLiveVideoEnabled: boolean
  isRecoveryCaptureEnabled: boolean
  toggleCameraEnabled: () => void
  toggleLiveVideoEnabled: () => void
  toggleRecoveryCaptureEnabled: () => void
}

// Stubs the general camera usage settings.
export function useStubCameraUsageSettings(): UseStubCameraUsageSettingsResult {
  const [isCameraEnabled, setIsCameraEnabled] = useState(true)
  const [isLiveVideoEnabled, setIsLiveVideoEnabled] = useState(true)
  const [isRecoveryCaptureEnabled, setIsRecoveryCaptureEnabled] = useState(true)

  const toggleCameraEnabled = (): void => {
    setIsCameraEnabled(!isCameraEnabled)
  }

  const toggleLiveVideoEnabled = (): void => {
    setIsLiveVideoEnabled(!isLiveVideoEnabled)
  }

  const toggleRecoveryCaptureEnabled = (): void => {
    setIsRecoveryCaptureEnabled(!isRecoveryCaptureEnabled)
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
