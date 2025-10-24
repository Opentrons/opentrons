import { useTranslation } from 'react-i18next'

import {
  InlineNotification,
  PrimaryButton,
  StyledText,
} from '@opentrons/components'

import { ToggleButton } from '/app/atoms/buttons'
import { SetupRunCameraControls } from '/app/organisms/Desktop/Devices/ProtocolRun/SetupCamera/SetupRunCameraControls'
import { SetupRunCameraUsage } from '/app/organisms/Desktop/Devices/ProtocolRun/SetupCamera/SetupRunCameraSettings'

import styles from './setupcamera.module.css'

import type { UseCameraUsageSettingsResult } from '/app/organisms/Desktop/Devices/RobotSettings/RobotSettingsCamera/hooks/useCameraUsageSettings'

export interface SetupCameraProps {
  settings: UseCameraUsageSettingsResult
  cameraConfirmed: boolean
  confirmCameraSettings: () => void
}

export function SetupCamera({
  settings,
  cameraConfirmed,
  confirmCameraSettings,
}: SetupCameraProps): JSX.Element {
  const { t } = useTranslation('protocol_setup')

  return (
    <div className={styles.container}>
      {/* TODO(jh, 09-29-25): Only show this noti if the camera is required to run this protocol.
       Update the confirm preferences btn, too. */}
      {!settings.isCameraEnabled && <CameraRequiredNotification />}
      <CameraStatus {...settings} />
      {settings.isCameraEnabled && (
        <>
          <SetupRunCameraUsage settings={settings} />
          <SetupRunCameraControls />
        </>
      )}
      <div className={styles.camera_btn_container}>
        <PrimaryButton
          onClick={confirmCameraSettings}
          disabled={cameraConfirmed || !settings.isCameraEnabled}
        >
          {t('confirm_preferences')}
        </PrimaryButton>
      </div>
    </div>
  )
}

function CameraRequiredNotification(): JSX.Element {
  const { t } = useTranslation('device_settings')

  return (
    <InlineNotification
      type="error"
      heading={t('camera_required')}
      message={t('enable_camera_to_run')}
    />
  )
}

interface CameraStatusProps {
  toggleCameraEnabled: UseCameraUsageSettingsResult['toggleCameraEnabled']
  isCameraEnabled: UseCameraUsageSettingsResult['isCameraEnabled']
}

function CameraStatus({
  toggleCameraEnabled,
  isCameraEnabled,
}: CameraStatusProps): JSX.Element {
  const { t } = useTranslation('device_settings')

  return (
    <div className={styles.camera_setting_container}>
      <div className={styles.camera_setting_text_container}>
        <div className={styles.camera_setting}>
          <StyledText desktopStyle="bodyDefaultSemiBold">
            {t('camera_status')}
          </StyledText>
          {isCameraEnabled ? (
            <StyledText
              desktopStyle="captionRegular"
              className={styles.camera_status_enabled}
            >
              {t('enabled')}
            </StyledText>
          ) : (
            <StyledText
              desktopStyle="captionRegular"
              className={styles.camera_status_disabled}
            >
              {t('disabled')}
            </StyledText>
          )}
        </div>
        <StyledText desktopStyle="bodyDefaultRegular">
          {t('camera_status_description')}
        </StyledText>
      </div>
      <div className={styles.setting_toggle_container}>
        <ToggleButton
          label={t('camera_status')}
          toggledOn={isCameraEnabled}
          onClick={toggleCameraEnabled}
        />
      </div>
    </div>
  )
}
