import { useTranslation } from 'react-i18next'

import { StyledText } from '@opentrons/components'

import { TertiaryButton } from '/app/atoms/buttons'
import styles from '/app/organisms/Desktop/Devices/RobotSettings/RobotSettingsCamera/camerasettings.module.css'

import type { JSX } from 'react'

export function CameraControlsSettings(): JSX.Element {
  const { t } = useTranslation('device_settings')

  return (
    <div className={styles.settings_container}>
      <StyledText desktopStyle="bodyLargeSemiBold">
        {t('camera_controls')}
      </StyledText>
      <div className={styles.camera_controls_container}>
        <div className={styles.camera_controls_text_container}>
          <StyledText desktopStyle="bodyDefaultSemiBold">
            {t('image_video_settings')}
          </StyledText>
          <StyledText desktopStyle="bodyDefaultRegular">
            {t('configure_camera_settings')}
          </StyledText>
        </div>
        <TertiaryButton>
          <StyledText desktopStyle="captionSemiBold">
            {t('edit_settings')}
          </StyledText>
        </TertiaryButton>
      </div>
    </div>
  )
}
