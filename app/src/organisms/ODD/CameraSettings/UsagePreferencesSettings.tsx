import { useTranslation } from 'react-i18next'

import { ListButton, StyledText } from '@opentrons/components'

import { OnOffToggle } from '/app/organisms/ODD/RobotSettingsDashboard'

import styles from './preferences.module.css'

// eslint-disable-next-line opentrons/no-imports-across-applications -- For active dev only
import type { UseCameraUsageSettingsResult } from '/app/organisms/Desktop/Devices/RobotSettings/RobotSettingsCamera/hooks/useCameraUsageSettings'

export interface UsagePreferencesSettingsProps {
  toggleLiveVideoEnabled: UseCameraUsageSettingsResult['toggleLiveVideoEnabled']
  toggleRecoveryCaptureEnabled: UseCameraUsageSettingsResult['toggleRecoveryCaptureEnabled']
  isLiveVideoEnabled: UseCameraUsageSettingsResult['isLiveVideoEnabled']
  isRecoveryCaptureEnabled: UseCameraUsageSettingsResult['isRecoveryCaptureEnabled']
}

export function UsagePreferencesSettings({
  isLiveVideoEnabled,
  isRecoveryCaptureEnabled,
  toggleRecoveryCaptureEnabled,
  toggleLiveVideoEnabled,
}: UsagePreferencesSettingsProps): JSX.Element {
  const { t } = useTranslation('device_settings')

  return (
    <div className={styles.usage_preferences_container}>
      <StyledText oddStyle="level4HeaderSemiBold">
        {t('usage_preferences')}
      </StyledText>
      <div className={styles.usage_preferences_btn_container}>
        <ListButton
          type="noActive"
          className={styles.setting_card}
          onClick={toggleLiveVideoEnabled}
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
          onClick={toggleRecoveryCaptureEnabled}
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
