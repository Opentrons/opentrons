import { Divider } from '@opentrons/components'

import styles from './camerasettings.module.css'
import { CameraStatusContainer } from './CameraStatusContainer'
import { useCameraUsageSettings } from './hooks/useCameraUsageSettings'
import { RobotSettingsCameraControls } from './RobotSettingsCameraControls'
import { RobotSettingsCameraUsage } from './RobotSettingsCameraUsage'

import type { JSX } from 'react'

export function RobotSettingsCamera(): JSX.Element {
  const {
    toggleCameraEnabled,
    isCameraEnabled,
    toggleLiveVideoEnabled,
    isLiveVideoEnabled,
    toggleRecoveryCaptureEnabled,
    isRecoveryCaptureEnabled,
  } = useCameraUsageSettings()

  return (
    <div className={styles.container}>
      <CameraStatusContainer
        toggleCameraEnabled={toggleCameraEnabled}
        isCameraEnabled={isCameraEnabled}
      />
      {isCameraEnabled && (
        <>
          <RobotSettingsCameraUsage
            isLiveVideoEnabled={isLiveVideoEnabled}
            isRecoveryCaptureEnabled={isRecoveryCaptureEnabled}
            toggleLiveVideoEnabled={toggleLiveVideoEnabled}
            toggleRecoveryCaptureEnabled={toggleRecoveryCaptureEnabled}
          />
          <Divider />
          <RobotSettingsCameraControls />
        </>
      )}
    </div>
  )
}
