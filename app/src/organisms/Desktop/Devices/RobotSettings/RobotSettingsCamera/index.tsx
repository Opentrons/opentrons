import { Divider } from '@opentrons/components'

import { useCurrentRunId } from '/app/resources/runs'

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
  const runId = useCurrentRunId()
  const doesRunExist = runId != null

  return (
    <div className={styles.container}>
      <CameraStatusContainer
        toggleCameraEnabled={toggleCameraEnabled}
        isCameraEnabled={isCameraEnabled}
        toggleDisabled={doesRunExist}
      />
      {isCameraEnabled && (
        <>
          <RobotSettingsCameraUsage
            isLiveVideoEnabled={isLiveVideoEnabled}
            isRecoveryCaptureEnabled={isRecoveryCaptureEnabled}
            toggleLiveVideoEnabled={toggleLiveVideoEnabled}
            toggleRecoveryCaptureEnabled={toggleRecoveryCaptureEnabled}
            toggleDisabled={doesRunExist}
          />
          <Divider />
          <RobotSettingsCameraControls />
        </>
      )}
    </div>
  )
}
