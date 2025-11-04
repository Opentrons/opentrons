import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { InlineNotification, StyledText } from '@opentrons/components'

import { useFeatureFlag } from '/app/redux/config'

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
  toggleCameraEnabled: () => void
  toggleRecoveryEnabled: () => void
  toggleLiveStreamEnabled: () => void
  /* We only utilize this info in a run context,
  not general settings context. */
  storageInfo: RobotStorageInfo | null
  isCameraRequired: boolean | null
}

export function CameraSettings({
  headerElement,
  sectionHeadingText,
  storageInfo,
  isCameraRequired,
  isCameraEnabled,
  toggleCameraEnabled,
  toggleRecoveryEnabled,
  toggleLiveStreamEnabled,
  isRecoveryCaptureEnabled,
  isLiveVideoEnabled,
}: CameraSettingsProps): JSX.Element {
  const isCameraSettingsEnabled = useFeatureFlag('camera')
  const [showControls, setShowControls] = useState(false)
  const toggleShowControls = (): void => {
    setShowControls(!showControls)
  }
  console.log('=>(index.tsx:50) isCameraRequired', isCameraRequired)

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
            toggleCameraEnabled={toggleCameraEnabled}
          />
          {isCameraEnabled && (
            <>
              <UsagePreferencesSettings
                toggleLiveVideoEnabled={toggleLiveStreamEnabled}
                toggleRecoveryCaptureEnabled={toggleRecoveryEnabled}
                isLiveVideoEnabled={isLiveVideoEnabled}
                isRecoveryCaptureEnabled={isRecoveryCaptureEnabled}
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
