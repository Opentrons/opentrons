import { useTranslation } from 'react-i18next'

import { ListButton, StyledText } from '@opentrons/components'

import { OnOffToggle } from '/app/organisms/ODD/RobotSettingsDashboard'
import {
  SOURCE_ROBOT_SETTINGS,
  useCameraAnalytics,
} from '/app/redux-resources/analytics/'
import { useRobotType } from '/app/redux-resources/robots'

import styles from './preferences.module.css'

import type { UseCameraUsageSettingsResult } from '/app/local-resources/images/hooks/useCameraUsageSettings'

export interface UsagePreferencesSettingsProps {
  toggleLiveVideoEnabled: UseCameraUsageSettingsResult['toggleLiveVideoEnabled']
  toggleRecoveryCaptureEnabled: UseCameraUsageSettingsResult['toggleRecoveryCaptureEnabled']
  isLiveVideoEnabled: UseCameraUsageSettingsResult['isLiveVideoEnabled']
  isRecoveryCaptureEnabled: UseCameraUsageSettingsResult['isRecoveryCaptureEnabled']
  robotName: string
  isCameraRequired: boolean | null
}

export function UsagePreferencesSettings({
  isLiveVideoEnabled,
  isRecoveryCaptureEnabled,
  toggleRecoveryCaptureEnabled,
  toggleLiveVideoEnabled,
  robotName,
  isCameraRequired,
}: UsagePreferencesSettingsProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const robotType = useRobotType(robotName)
  const { reportCameraEnablementSettings } = useCameraAnalytics({
    robotType: robotType,
    source: SOURCE_ROBOT_SETTINGS,
  })

  const handleToggleLiveStream = (): void => {
    toggleLiveVideoEnabled()
    if (isCameraRequired === null) {
      reportCameraEnablementSettings({
        cameraEnabled: true,
        liveFeedEnabled: !isLiveVideoEnabled,
        recoveryCaptureEnabled: isRecoveryCaptureEnabled,
      })
    }
  }

  const handleToggleRecovery = (): void => {
    toggleRecoveryCaptureEnabled()
    if (isCameraRequired === null) {
      reportCameraEnablementSettings({
        cameraEnabled: true,
        liveFeedEnabled: isLiveVideoEnabled,
        recoveryCaptureEnabled: !isRecoveryCaptureEnabled,
      })
    }
  }
  return (
    <div className={styles.usage_preferences_container}>
      <StyledText oddStyle="level4HeaderSemiBold">
        {t('usage_preferences')}
      </StyledText>
      <div className={styles.usage_preferences_btn_container}>
        <ListButton
          type="noActive"
          className={styles.setting_card}
          onClick={handleToggleLiveStream}
        >
          <div className={styles.usage_text_container}>
            <StyledText oddStyle="level4HeaderSemiBold">
              {t('live_video_lc')}
            </StyledText>
            <StyledText
              className={styles.usage_subtext}
              oddStyle="level4HeaderRegular"
            >
              {t('live_video_description')}
            </StyledText>
          </div>
          <OnOffToggle isOn={isLiveVideoEnabled} />
        </ListButton>
        <ListButton
          type="noActive"
          className={styles.setting_card}
          onClick={handleToggleRecovery}
        >
          <div className={styles.usage_text_container}>
            <StyledText oddStyle="level4HeaderSemiBold">
              {t('error_recovery_lc')}
            </StyledText>
            <StyledText
              className={styles.usage_subtext}
              oddStyle="level4HeaderRegular"
            >
              {t('error_recovery_camera_description')}
            </StyledText>
          </div>
          <OnOffToggle isOn={isRecoveryCaptureEnabled} />
        </ListButton>
      </div>
    </div>
  )
}
