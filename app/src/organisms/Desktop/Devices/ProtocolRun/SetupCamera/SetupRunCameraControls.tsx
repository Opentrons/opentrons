import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import { StyledText } from '@opentrons/components'

import { getTopPortalEl } from '/app/App/portal'
import { TertiaryButton } from '/app/atoms/buttons'
import { CameraControls } from '/app/organisms/Desktop/Camera/CameraControls'
import styles from '/app/organisms/Desktop/Devices/ProtocolRun/SetupCamera/setupcamera.module.css'

import type { ReactNode } from 'react'

export interface SetupRunCameraControlsProps {
  cameraConfirmed: boolean
  runId: string
}

export function SetupRunCameraControls({
  cameraConfirmed,
  runId,
}: SetupRunCameraControlsProps): ReactNode {
  const { t } = useTranslation('device_settings')
  const [showControls, setShowControls] = useState(false)
  const toggleControls = (): void => {
    setShowControls(!showControls)
  }

  return (
    <div className={styles.control_settings_container}>
      <StyledText desktopStyle="bodyDefaultSemiBold">
        {t('camera_controls')}
      </StyledText>
      <div className={styles.camera_setting_container}>
        <div className={styles.camera_setting_text_container}>
          <StyledText desktopStyle="bodyDefaultSemiBold">
            {t('image_video_settings')}
          </StyledText>
          <StyledText desktopStyle="bodyDefaultRegular">
            {t('configure_camera_settings')}
          </StyledText>
        </div>
        <TertiaryButton onClick={toggleControls} disabled={cameraConfirmed}>
          <StyledText desktopStyle="captionSemiBold">
            {t('edit_settings')}
          </StyledText>
        </TertiaryButton>
      </div>
      {showControls &&
        createPortal(
          <CameraControls onClose={toggleControls} runId={runId} />,
          getTopPortalEl()
        )}
    </div>
  )
}
