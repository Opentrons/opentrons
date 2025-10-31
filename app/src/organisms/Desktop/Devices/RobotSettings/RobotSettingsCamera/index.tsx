import { Divider } from '@opentrons/components'

import { useCameraAnalytics } from '/app/redux-resources/analytics'
import { useCameraUsageSettings } from '/app/local-resources/images/hooks/useCameraUsageSettings'
import { useFeatureFlag } from '/app/redux/config'
import { useCurrentRunId } from '/app/resources/runs'

import styles from './camerasettings.module.css'
import { CameraStatusContainer } from './CameraStatusContainer'
import { RobotSettingsCameraControls } from './RobotSettingsCameraControls'
import { RobotSettingsCameraUsage } from './RobotSettingsCameraUsage'

import type { JSX } from 'react'
import type { RobotType } from '@opentrons/shared-data'

export interface RobotSettingsCameraProps {
  robotType: RobotType
}
export function RobotSettingsCamera({
  robotType,
}: RobotSettingsCameraProps): JSX.Element {
  const {
    toggleCameraEnabled,
    isCameraEnabled,
    toggleLiveVideoEnabled,
    isLiveVideoEnabled,
    toggleRecoveryCaptureEnabled,
    isRecoveryCaptureEnabled,
  } = useCameraUsageSettings()
  const baseParams = { source: 'robotSettings' as const, robotType: robotType }
  const { reportCameraEnablementSettings } = useCameraAnalytics(baseParams)
  reportCameraEnablementSettings({
    ...baseParams,
    cameraEnabled: isCameraEnabled,
    liveFeedEnabled: isLiveVideoEnabled,
    recoveryCaptureEnabled: isRecoveryCaptureEnabled,
  })
  const runId = useCurrentRunId()
  const doesRunExist = runId != null
  const isCameraSettingsEnabled = useFeatureFlag('camera')

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
