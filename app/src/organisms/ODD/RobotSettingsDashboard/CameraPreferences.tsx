import { useTranslation } from 'react-i18next'

// eslint-disable-next-line opentrons/no-imports-across-applications
import { useCameraUsageSettings } from '/app/organisms/Desktop/Devices/RobotSettings/RobotSettingsCamera/hooks/useCameraUsageSettings'
import { CameraSettings } from '/app/organisms/ODD/CameraSettings'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'

import type { SetSettingOption } from '/app/organisms/ODD/RobotSettingsDashboard'

export interface CameraPreferencesProps {
  setCurrentOption: SetSettingOption
}

export function CameraPreferences({
  setCurrentOption,
}: CameraPreferencesProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const settings = useCameraUsageSettings()

  return (
    <CameraSettings
      sectionHeadingText={t('camera_preferences_description_long')}
      headerElement={
        <ChildNavigation
          header={t('camera_preferences')}
          onClickBack={() => {
            setCurrentOption(null)
          }}
        />
      }
      {...settings}
      toggleCameraEnabled={settings.toggleCameraEnabled}
      toggleRecoveryEnabled={settings.toggleRecoveryCaptureEnabled}
      toggleLiveStreamEnabled={settings.toggleLiveVideoEnabled}
      storageInfo={null}
      isCameraRequired={null}
    />
  )
}
