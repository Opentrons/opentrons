import { useTranslation } from 'react-i18next'

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

  return (
    <CameraSettings
      sectionHeadingText={t('camera_preferences_description_long')}
      headerElement={
        <ChildNavigation
          header={t('camera_preferences')}
          onClickBack={() => {
            setCurrentOption(null)
          }}
          marginBottom="7.75rem"
        />
      }
      storageInfo={null}
    />
  )
}
