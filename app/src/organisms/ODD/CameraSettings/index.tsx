import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { InlineNotification, StyledText } from '@opentrons/components'

import { useToaster } from '/app/organisms/ToasterOven'
import {
  SOURCE_ROBOT_SETTINGS,
  useCameraAnalytics,
} from '/app/redux-resources/analytics'
import { useRobotType } from '/app/redux-resources/robots'
import { useFeatureFlag } from '/app/redux/config'

import { CameraControls } from './CameraControls'
import { CameraEnableSetting } from './CameraEnableSetting'
import { ControlPreferencesSettings } from './ControlPreferencesSettings'
import styles from './preferences.module.css'
import { UsagePreferencesSettings } from './UsagePreferencesSettings'

import type { ReactNode } from 'react'
import type { Protocol } from '@opentrons/api-client'
import type { RobotStorageInfo } from '/app/resources/health/useIsImageStorageLow'

const TOAST_DURATION_MS = 3000

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
  protocolRecord: Protocol | null
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
  protocolRecord,
}: CameraSettingsProps): JSX.Element {
  const { t } = useTranslation('protocol_setup')
  const isCameraSettingsEnabled = useFeatureFlag('camera')
  const isQuickTransfer = protocolRecord?.data.protocolKind === 'quick-transfer'
  const { makeSnackbar } = useToaster()
  const [showControls, setShowControls] = useState(false)
  const toggleShowControls = (): void => {
    setShowControls(!showControls)
  }
  const robotType = useRobotType(robotName)
  const { reportCameraEnablementSettings } = useCameraAnalytics({
    robotType: robotType,
    source: SOURCE_ROBOT_SETTINGS,
  })
  const recoveryEnabledByRunType = isQuickTransfer
    ? false
    : isRecoveryCaptureEnabled

  const handleToggleCamera = (): void => {
    toggleCameraEnabled()
    if (isCameraRequired === null) {
      reportCameraEnablementSettings({
        cameraEnabled: !isCameraEnabled,
        liveFeedEnabled: isLiveVideoEnabled,
        recoveryCaptureEnabled: recoveryEnabledByRunType,
      })
    }
  }
  const handleToggleLiveStream = (): void => {
    toggleLiveStreamEnabled()
    if (isCameraRequired === null) {
      reportCameraEnablementSettings({
        cameraEnabled: isCameraEnabled,
        liveFeedEnabled: !isLiveVideoEnabled,
        recoveryCaptureEnabled: recoveryEnabledByRunType,
      })
    }
  }

  const handleToggleRecovery = (): void => {
    if (isQuickTransfer) {
      makeSnackbar(
        t('no_camera_during_quick_transfer') as string,
        TOAST_DURATION_MS
      )
    } else {
      toggleRecoveryEnabled()
      if (isCameraRequired === null) {
        reportCameraEnablementSettings({
          cameraEnabled: isCameraEnabled,
          liveFeedEnabled: isLiveVideoEnabled,
          recoveryCaptureEnabled: !isRecoveryCaptureEnabled,
        })
      }
    }
  }
  if (showControls) {
    return <CameraControls toggleShowControls={toggleShowControls} />
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
                isRecoveryCaptureEnabled={recoveryEnabledByRunType}
                robotName={robotName}
              />
              {isCameraSettingsEnabled && (
                <ControlPreferencesSettings
                  toggleShowControls={toggleShowControls}
                />
              )}
            </>
          )}
        </div>
      </div>
    )
  }
}

function StorageAlmostFullNotification(): JSX.Element {
  const { t } = useTranslation(['protocol_setup', 'branded'])

  return (
    <InlineNotification
      type="alert"
      heading={t('protocol_setup:image_storage_almost_full')}
      message={t('branded:clear_images_on_desktop')}
    />
  )
}

function CameraRequiredNotification(): JSX.Element {
  const { t } = useTranslation('device_settings')

  return (
    <InlineNotification
      type="error"
      heading={t('camera_required')}
      message={t('enable_camera_to_run')}
    />
  )
}
