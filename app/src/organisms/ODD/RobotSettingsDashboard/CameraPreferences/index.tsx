import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { StyledText } from '@opentrons/components'

// eslint-disable-next-line opentrons/no-imports-across-applications -- For active dev only
import { useStubCameraUsageSettings } from '/app/organisms/Desktop/Devices/RobotSettings/RobotSettingsCamera/hooks/useStubCameraUsageSettings'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'
import { ControlPreferencesSettings } from '/app/organisms/ODD/RobotSettingsDashboard/CameraPreferences/ControlPreferencesSettings'

import { CameraControls } from './CameraControls'
import { CameraEnableSetting } from './CameraEnableSetting'
import styles from './preferences.module.css'
import { UsagePreferencesSettings } from './UsagePreferencesSettings'

import type { SetSettingOption } from '/app/organisms/ODD/RobotSettingsDashboard'

export interface CameraPreferencesProps {
  setCurrentOption: SetSettingOption
}

export function CameraPreferences({
  setCurrentOption,
}: CameraPreferencesProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const {
    isCameraEnabled,
    toggleCameraEnabled,
    toggleLiveVideoEnabled,
    isLiveVideoEnabled,
    isRecoveryCaptureEnabled,
    toggleRecoveryCaptureEnabled,
  } = useStubCameraUsageSettings()

  const [showControls, setShowControls] = useState(false)
  const toggleShowControls = (): void => {
    setShowControls(!showControls)
  }

  if (showControls) {
    return <CameraControls toggleShowControls={toggleShowControls} />
  } else {
    return (
      <div className={styles.container}>
        <ChildNavigation
          header={t('camera_preferences')}
          onClickBack={() => {
            setCurrentOption(null)
          }}
        />
        <div className={styles.content_container}>
          <StyledText oddStyle="level4HeaderRegular">
            {t('camera_preferences_description_long')}
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
