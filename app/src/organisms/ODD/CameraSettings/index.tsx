import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { InlineNotification, StyledText } from '@opentrons/components'

import {
  SOURCE_ROBOT_SETTINGS,
  useCameraAnalytics,
} from '/app/redux-resources/analytics'
import { useRobotType } from '/app/redux-resources/robots'

import { CameraControls } from './CameraControls'
import { CameraEnableSetting } from './CameraEnableSetting'
import { ControlPreferencesSettings } from './ControlPreferencesSettings'
import styles from './preferences.module.css'
import { UsagePreferencesSettings } from './UsagePreferencesSettings'

import type { ReactNode } from 'react'
import type { RobotStorageInfo } from '/app/resources/health/useIsImageStorageLow'

export interface CameraSettingsProps {
  /* A header element for the page content. */
  headerElement: ReactNode
  sectionHeadingText: string
  isCameraEnabled: boolean
  isLiveVideoEnabled: boolean
  isRecoveryCaptureEnabled: boolean
  robotName: string
  toggleCameraEnabled: () => void
  toggleRecoveryEnabled: () => void
  toggleLiveStreamEnabled: () => void
  /* We only utilize this info in a run context,
  not general settings context. */
  storageInfo: RobotStorageInfo | null
  isCameraRequired: boolean | null
  runId: string | null
}

export function CameraSettings({
  headerElement,
  sectionHeadingText,
  storageInfo,
  isCameraRequired,
  isCameraEnabled,
  robotName,
  toggleCameraEnabled,
  toggleRecoveryEnabled,
  toggleLiveStreamEnabled,
  isRecoveryCaptureEnabled,
  isLiveVideoEnabled,
  runId,
}: CameraSettingsProps): ReactNode {
  const [showControls, setShowControls] = useState(false)
  const toggleShowControls = (): void => {
    setShowControls(!showControls)
  }
  const robotType = useRobotType(robotName)
  const { reportCameraEnablementSettings } = useCameraAnalytics({
    robotType: robotType,
    source: SOURCE_ROBOT_SETTINGS,
  })

  const handleToggleCamera = (): void => {
    toggleCameraEnabled()
    if (isCameraRequired === null) {
      reportCameraEnablementSettings({
        cameraEnabled: !isCameraEnabled,
        liveFeedEnabled: isLiveVideoEnabled,
        recoveryCaptureEnabled: isRecoveryCaptureEnabled,
      })
    }
  }
  const handleToggleLiveStream = (): void => {
    toggleLiveStreamEnabled()
    if (isCameraRequired === null) {
      reportCameraEnablementSettings({
        cameraEnabled: isCameraEnabled,
        liveFeedEnabled: !isLiveVideoEnabled,
        recoveryCaptureEnabled: isRecoveryCaptureEnabled,
      })
    }
  }

  const handleToggleRecovery = (): void => {
    toggleRecoveryEnabled()
    if (isCameraRequired === null) {
      reportCameraEnablementSettings({
        cameraEnabled: isCameraEnabled,
        liveFeedEnabled: isLiveVideoEnabled,
        recoveryCaptureEnabled: !isRecoveryCaptureEnabled,
      })
    }
  }
  if (showControls) {
    return (
      <CameraControls toggleShowControls={toggleShowControls} runId={runId} />
    )
  } else {
    return (
      <div
        className={
          isCameraRequired === null
            ? styles.container_settings
            : styles.container_run
        }
      >
        {headerElement}
        <div className={styles.content_container}>
          {!isCameraEnabled && isCameraRequired && (
            <CameraRequiredNotification />
          )}
          {storageInfo != null &&
            !storageInfo.isLoading &&
            storageInfo.isImageStorageLow && <StorageAlmostFullNotification />}
          <StyledText oddStyle="level4HeaderRegular">
            {sectionHeadingText}
          </StyledText>
          <CameraEnableSetting
            isCameraEnabled={isCameraEnabled}
            toggleCameraEnabled={handleToggleCamera}
          />
          {isCameraEnabled && (
            <>
              <UsagePreferencesSettings
                toggleLiveVideoEnabled={handleToggleLiveStream}
                toggleRecoveryCaptureEnabled={handleToggleRecovery}
                isLiveVideoEnabled={isLiveVideoEnabled}
                isRecoveryCaptureEnabled={isRecoveryCaptureEnabled}
                robotName={robotName}
              />
              <ControlPreferencesSettings
                toggleShowControls={toggleShowControls}
              />
            </>
          )}
        </div>
      </div>
    )
  }
}

function StorageAlmostFullNotification(): ReactNode {
  const { t } = useTranslation(['protocol_setup', 'branded'])

  return (
    <InlineNotification
      type="alert"
      heading={t('protocol_setup:image_storage_almost_full')}
      message={t('branded:clear_images_on_desktop')}
    />
  )
}

function CameraRequiredNotification(): ReactNode {
  const { t } = useTranslation('device_settings')

  return (
    <InlineNotification
      type="error"
      heading={t('camera_required')}
      message={t('enable_camera_to_run')}
    />
  )
}
