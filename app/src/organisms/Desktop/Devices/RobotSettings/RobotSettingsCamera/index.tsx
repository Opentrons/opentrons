import { Divider } from '@opentrons/components'

import { useCameraUsageSettings } from '/app/local-resources/images/hooks/useCameraUsageSettings'
import {
  SOURCE_ROBOT_SETTINGS,
  useCameraAnalytics,
} from '/app/redux-resources/analytics'
import { useFeatureFlag } from '/app/redux/config'

import styles from './camerasettings.module.css'
import { CameraStatusContainer } from './CameraStatusContainer'
import { RobotSettingsCameraControls } from './RobotSettingsCameraControls'
import { RobotSettingsCameraUsage } from './RobotSettingsCameraUsage'

import type { JSX } from 'react'
import type { RobotType } from '@opentrons/shared-data'

export interface RobotSettingsCameraProps {
  robotType: RobotType
  isRobotBusy: boolean
}
export function RobotSettingsCamera({
  robotType,
  isRobotBusy,
}: RobotSettingsCameraProps): JSX.Element {
  const {
    toggleCameraEnabled,
    isCameraEnabled,
    toggleLiveVideoEnabled,
    isLiveVideoEnabled,
    toggleRecoveryCaptureEnabled,
    isRecoveryCaptureEnabled,
  } = useCameraUsageSettings()
  const { reportCameraEnablementSettings } = useCameraAnalytics({
    source: SOURCE_ROBOT_SETTINGS,
    robotType: robotType,
  })
  const isCameraSettingsEnabled = useFeatureFlag('camera')
  const handleToggleLiveStream = (): void => {
    toggleLiveVideoEnabled()
    reportCameraEnablementSettings({
      cameraEnabled: true,
      liveFeedEnabled: !isLiveVideoEnabled,
      recoveryCaptureEnabled: isRecoveryCaptureEnabled,
    })
  }

  const handleToggleRecovery = (): void => {
    toggleRecoveryCaptureEnabled()
    reportCameraEnablementSettings({
      cameraEnabled: true,
      liveFeedEnabled: isLiveVideoEnabled,
      recoveryCaptureEnabled: isRecoveryCaptureEnabled,
    })
  }
  return (
    <div className={styles.container}>
      <CameraStatusContainer
        toggleCameraEnabled={toggleCameraEnabled}
        isCameraEnabled={isCameraEnabled}
        toggleDisabled={isRobotBusy}
      />
      {isCameraEnabled && (
        <>
          <RobotSettingsCameraUsage
            isLiveVideoEnabled={isLiveVideoEnabled}
            isRecoveryCaptureEnabled={isRecoveryCaptureEnabled}
            toggleLiveVideoEnabled={handleToggleLiveStream}
            toggleRecoveryCaptureEnabled={handleToggleRecovery}
            toggleDisabled={isRobotBusy}
          />
          {isCameraSettingsEnabled && (
            <>
              <Divider />
              <RobotSettingsCameraControls />
            </>
          )}
        </>
      )}
    </div>
  )
}
