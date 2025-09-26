import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import { StyledText } from '@opentrons/components'

import { getTopPortalEl } from '/app/App/portal'
import { TertiaryButton } from '/app/atoms/buttons'
import { CameraControls } from '/app/organisms/Desktop/Camera/CameraControls'
import styles from '/app/organisms/Desktop/Devices/RobotSettings/RobotSettingsCamera/camerasettings.module.css'

import type { JSX } from 'react'

export function CameraControlsSettings(): JSX.Element {
  const { t } = useTranslation('device_settings')
  const [showControls, setShowControls] = useState(false)

  const toggleControls = (): void => {
    setShowControls(!showControls)
  }

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
        <TertiaryButton onClick={toggleControls}>
          <StyledText desktopStyle="captionSemiBold">
            {t('edit_settings')}
          </StyledText>
        </TertiaryButton>
      </div>
      {showControls &&
        createPortal(
          <CameraControls onClose={toggleControls} />,
          getTopPortalEl()
        )}
    </div>
  )
}
