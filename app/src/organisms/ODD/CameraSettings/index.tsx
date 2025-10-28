import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { InlineNotification, StyledText } from '@opentrons/components'

// eslint-disable-next-line opentrons/no-imports-across-applications -- For active dev only
import { useCameraUsageSettings } from '/app/organisms/Desktop/Devices/RobotSettings/RobotSettingsCamera/hooks/useCameraUsageSettings'

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
  /* We only utilize storage info in a run context, not general settings context. */
  storageInfo: RobotStorageInfo | null
}

export function CameraSettings({
  headerElement,
  sectionHeadingText,
  storageInfo,
}: CameraSettingsProps): JSX.Element {
  const {
    isCameraEnabled,
    toggleCameraEnabled,
    toggleLiveVideoEnabled,
    isLiveVideoEnabled,
    isRecoveryCaptureEnabled,
    toggleRecoveryCaptureEnabled,
  } = useCameraUsageSettings()

  const [showControls, setShowControls] = useState(false)
  const toggleShowControls = (): void => {
    setShowControls(!showControls)
  }

  if (showControls) {
    return <CameraControls toggleShowControls={toggleShowControls} />
  } else {
    return (
      <div className={styles.container}>
        {headerElement}
        <div className={styles.content_container}>
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
                toggleLiveVideoEnabled={toggleLiveVideoEnabled}
                toggleRecoveryCaptureEnabled={toggleRecoveryCaptureEnabled}
                isLiveVideoEnabled={isLiveVideoEnabled}
                isRecoveryCaptureEnabled={isRecoveryCaptureEnabled}
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
