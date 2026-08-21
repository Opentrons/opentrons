import { Divider } from '@opentrons/components'

import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { useCameraUsageSettings } from '/app/local-resources/images/hooks/useCameraUsageSettings'
import {
  SOURCE_ROBOT_SETTINGS,
  useCameraAnalytics,
} from '/app/redux-resources/analytics'
import { useIsFlex, useRobotType } from '/app/redux-resources/robots'

import styles from './camerasettings.module.css'
import { CameraStatusContainer } from './CameraStatusContainer'
import { RobotSettingsCameraControls } from './RobotSettingsCameraControls'
import { RobotSettingsCameraUsage } from './RobotSettingsCameraUsage'

import type { JSX } from 'react'

export interface RobotSettingsCameraProps {
  robotName: string
  isRobotBusy: boolean
}
export function RobotSettingsCamera({
  robotName,
  isRobotBusy,
}: RobotSettingsCameraProps): JSX.Element {
  const documentationState = useDocumentationState()
  const {
    toggleCameraEnabled,
    isCameraEnabled,
    toggleLiveVideoEnabled,
    isLiveVideoEnabled,
    toggleRecoveryCaptureEnabled,
    isRecoveryCaptureEnabled,
  } = useCameraUsageSettings(documentationState)
  const robotType = useRobotType(robotName)
  const isFlex = useIsFlex(robotName)
  const { reportCameraEnablementSettings } = useCameraAnalytics({
    source: SOURCE_ROBOT_SETTINGS,
    robotType,
  })
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
        isFlex={isFlex}
      />
      {isCameraEnabled && (
        <>
          <RobotSettingsCameraUsage
            isLiveVideoEnabled={isLiveVideoEnabled}
            isRecoveryCaptureEnabled={isRecoveryCaptureEnabled}
            toggleLiveVideoEnabled={handleToggleLiveStream}
            toggleRecoveryCaptureEnabled={handleToggleRecovery}
            toggleDisabled={isRobotBusy}
            robotType={robotType}
          />
          <>
            <Divider />
            <RobotSettingsCameraControls disabled={isRobotBusy} />
          </>
        </>
      )}
    </div>
  )
}
