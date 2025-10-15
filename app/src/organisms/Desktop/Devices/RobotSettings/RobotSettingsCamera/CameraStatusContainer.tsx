import { useTranslation } from 'react-i18next'

import { Chip, StyledText } from '@opentrons/components'

import { ToggleButton } from '/app/atoms/buttons'
import styles from '/app/organisms/Desktop/Devices/RobotSettings/RobotSettingsCamera/camerasettings.module.css'

import type { JSX } from 'react'

export interface CameraStatusContainerProps {
  toggleCameraEnabled: () => void
  isCameraEnabled: boolean
}

export function CameraStatusContainer({
  toggleCameraEnabled,
  isCameraEnabled,
}: CameraStatusContainerProps): JSX.Element {
  const { t } = useTranslation('device_settings')

  return (
    <div className={styles.status_container}>
      <div className={styles.status_content_container}>
        <div className={styles.status_camera_status}>
          <StyledText desktopStyle="bodyLargeSemiBold">
            {t('camera_status')}
          </StyledText>
          {isCameraEnabled ? (
            <Chip text={t('enabled')} type="success" hasIcon={false} />
          ) : (
            <Chip text={t('disabled')} type="neutral" hasIcon={false} />
          )}
        </div>
        <StyledText desktopStyle="bodyDefaultRegular">
          {t('camera_status_description')}
        </StyledText>
      </div>
      <div className={styles.status_toggle_container}>
        <ToggleButton
          label={t('camera_status')}
          toggledOn={isCameraEnabled}
          onClick={toggleCameraEnabled}
        />
      </div>
    </div>
  )
}
