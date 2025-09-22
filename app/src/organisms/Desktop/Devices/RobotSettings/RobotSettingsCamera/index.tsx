import { Divider } from '@opentrons/components'

import { CameraControlsSettings } from './CameraControlSettings'
import styles from './camerasettings.module.css'
import { CameraStatusContainer } from './CameraStatusContainer'
import { CameraUsageSettings } from './CameraUsageSettings'
import { useStubCameraUsageSettings } from './hooks/useStubCameraUsageSettings'

import type { JSX } from 'react'

export function RobotSettingsCamera(): JSX.Element {
  const {
    toggleCameraEnabled,
    isCameraEnabled,
    toggleLiveVideoEnabled,
    isLiveVideoEnabled,
    toggleRecoveryCaptureEnabled,
    isRecoveryCaptureEnabled,
  } = useStubCameraUsageSettings()

  return (
    <div className={styles.container}>
      <CameraStatusContainer
        toggleCameraEnabled={toggleCameraEnabled}
        isCameraEnabled={isCameraEnabled}
      />
      {isCameraEnabled && (
        <>
          <CameraUsageSettings
            isLiveVideoEnabled={isLiveVideoEnabled}
            isRecoveryCaptureEnabled={isRecoveryCaptureEnabled}
            toggleLiveVideoEnabled={toggleLiveVideoEnabled}
            toggleRecoveryCaptureEnabled={toggleRecoveryCaptureEnabled}
          />
          <Divider />
          <CameraControlsSettings />
        </>
      )}
    </div>
  )
}
