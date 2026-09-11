import { useTranslation } from 'react-i18next'

import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { useCameraUsageSettings } from '/app/local-resources/images/hooks/useCameraUsageSettings'
import { CameraSettings } from '/app/organisms/ODD/CameraSettings'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'

import type { SetSettingOption } from '/app/organisms/ODD/RobotSettingsDashboard'

export interface CameraPreferencesProps {
  setCurrentOption: SetSettingOption
  robotName: string
}

export function CameraPreferences({
  setCurrentOption,
  robotName,
}: CameraPreferencesProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const documentationState = useDocumentationState()
  const settings = useCameraUsageSettings(documentationState)

  return (
    <CameraSettings
      robotName={robotName}
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
      runId={null}
    />
  )
}
