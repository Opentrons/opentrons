import { useTranslation } from 'react-i18next'

import { Icon, ListButton, StyledText } from '@opentrons/components'

import styles from './preferences.module.css'

import type { ReactNode } from 'react'

export interface ControlPreferencesSettingsProps {
  toggleShowControls: () => void
}

export function ControlPreferencesSettings({
  toggleShowControls,
}: ControlPreferencesSettingsProps): ReactNode {
  const { t } = useTranslation('device_settings')

  return (
    <div className={styles.usage_preferences_container}>
      <StyledText oddStyle="level4HeaderSemiBold">
        {t('camera_controls')}
      </StyledText>
      <div className={styles.usage_preferences_btn_container}>
        <ListButton
          type="noActive"
          className={styles.setting_card}
          onClick={toggleShowControls}
        >
          <div className={styles.usage_text_container}>
            <StyledText oddStyle="level4HeaderSemiBold">
              {t('image_video_settings_lc')}
            </StyledText>
            <StyledText
              className={styles.usage_subtext}
              oddStyle="level4HeaderRegular"
            >
              {t('configure_camera_settings')}
            </StyledText>
          </div>
          <Icon name="more" size="3rem" />
        </ListButton>
      </div>
    </div>
  )
}
