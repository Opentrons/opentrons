import { useTranslation } from 'react-i18next'

import { Divider, StyledText } from '@opentrons/components'

import { ToggleButton } from '/app/atoms/buttons'
import styles from '/app/organisms/Desktop/Devices/RobotSettings/RobotSettingsCamera/camerasettings.module.css'

import type { JSX } from 'react'

export interface CameraUsageSettingsProps {
  toggleLiveVideoEnabled: () => void
  isLiveVideoEnabled: boolean
  toggleRecoveryCaptureEnabled: () => void
  isRecoveryCaptureEnabled: boolean
}

export function CameraUsageSettings({
  toggleLiveVideoEnabled,
  toggleRecoveryCaptureEnabled,
  isRecoveryCaptureEnabled,
  isLiveVideoEnabled,
}: CameraUsageSettingsProps): JSX.Element {
  const { t } = useTranslation('device_settings')

  return (
    <div className={styles.settings_container}>
      <StyledText desktopStyle="bodyLargeSemiBold">
        {t('usage_settings')}
      </StyledText>
      <div className={styles.usage_item_container}>
        <div className={styles.usage_item_text_container}>
          <StyledText desktopStyle="bodyDefaultSemiBold">
            {t('live_video')}
          </StyledText>
          <StyledText desktopStyle="bodyDefaultRegular">
            {t('view_realtime_video')}
          </StyledText>
        </div>
        <ToggleButton
          label={t('live_video')}
          toggledOn={isLiveVideoEnabled}
          onClick={toggleLiveVideoEnabled}
        />
      </div>
      <Divider />
      <div className={styles.usage_item_container}>
        <div className={styles.usage_item_text_container}>
          <StyledText desktopStyle="bodyDefaultSemiBold">
            {t('error_recovery')}
          </StyledText>
          <StyledText desktopStyle="bodyDefaultRegular">
            {t('automatically_capture_image')}
          </StyledText>
        </div>
        <ToggleButton
          label={t('live_video')}
          toggledOn={isRecoveryCaptureEnabled}
          onClick={toggleRecoveryCaptureEnabled}
        />
      </div>
    </div>
  )
}
