import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import {
  InlineNotification,
  PrimaryButton,
  StyledText,
} from '@opentrons/components'
import { useAddCameraSettingsToRunMutation } from '@opentrons/react-api-client'

import { ToggleButton } from '/app/atoms/buttons'
import { SetupRunCameraControls } from '/app/organisms/Desktop/Devices/ProtocolRun/SetupCamera/SetupRunCameraControls'
import { SetupRunCameraUsage } from '/app/organisms/Desktop/Devices/ProtocolRun/SetupCamera/SetupRunCameraSettings'
import { useRobotType } from '/app/redux-resources/robots'
import { useFeatureFlag } from '/app/redux/config'
import {
  getCameraUsageState,
  updateCameraEnablement,
  updateCameraRecoveryEnablement,
  updateCameraStreamEnablement,
} from '/app/redux/protocol-runs'
import { useRobotStorageInfo } from '/app/resources/health/useIsImageStorageLow'

import styles from './setupcamera.module.css'

import type { UseCameraUsageSettingsResult } from '/app/local-resources/images/hooks/useCameraUsageSettings'
import type { State } from '/app/redux/types'

export interface SetupCameraProps {
  runId: string
  robotName: string
  isCameraRequired: boolean
  cameraConfirmed: boolean
  confirmCameraSettings: () => void
}

export function SetupCamera({
  runId,
  robotName,
  isCameraRequired,
  cameraConfirmed,
  confirmCameraSettings,
}: SetupCameraProps): JSX.Element {
  const { t } = useTranslation('protocol_setup')
  const robotType = useRobotType(robotName)
  const isCameraSettingsEnabled = useFeatureFlag('camera')
  const storageInfo = useRobotStorageInfo()
  const dispatch = useDispatch()
  const { addCameraSettingsToRun } = useAddCameraSettingsToRunMutation()

  const {
    liveStreamEnabled,
    enabled: cameraEnabled,
    recoveryEnabled,
  } = useSelector((state: State) => getCameraUsageState(state, runId))

  const toggleCameraEnabled = (): void => {
    dispatch(updateCameraEnablement(runId, !cameraEnabled))
  }

  const toggleRecoveryEnabled = (): void => {
    dispatch(updateCameraRecoveryEnablement(runId, !recoveryEnabled))
  }

  const toggleLiveStreamEnabled = (): void => {
    dispatch(updateCameraStreamEnablement(runId, !liveStreamEnabled))
  }

  const onConfirmPreferences = (): void => {
    addCameraSettingsToRun({
      runId,
      settings: {
        cameraEnabled,
        liveStreamEnabled,
        errorRecoveryCameraEnabled: recoveryEnabled,
      },
    })
    confirmCameraSettings()
  }

  return (
    <div className={styles.container}>
      {!cameraEnabled && isCameraRequired && <CameraRequiredNotification />}
      {!storageInfo.isLoading && storageInfo.isImageStorageLow && (
        <StorageAlmostFullNotification robotName={robotName} />
      )}
      <CameraStatus
        toggleCameraEnabled={toggleCameraEnabled}
        isCameraEnabled={cameraEnabled}
        cameraConfirmed={cameraConfirmed}
      />
      {cameraEnabled && (
        <>
          <SetupRunCameraUsage
            robotType={robotType}
            runId={runId}
            cameraEnabled={cameraEnabled}
            liveStreamEnabled={liveStreamEnabled}
            recoveryEnabled={recoveryEnabled}
            toggleRecoveryEnabled={toggleRecoveryEnabled}
            toggleLiveStreamEnabled={toggleLiveStreamEnabled}
            cameraConfirmed={cameraConfirmed}
          />
          {isCameraSettingsEnabled && <SetupRunCameraControls />}
        </>
      )}
      <div className={styles.camera_btn_container}>
        <PrimaryButton
          onClick={onConfirmPreferences}
          disabled={cameraConfirmed || !cameraEnabled}
        >
          {t('confirm_preferences')}
        </PrimaryButton>
      </div>
    </div>
  )
}

function StorageAlmostFullNotification({
  robotName,
}: {
  robotName: string
}): JSX.Element {
  const { t } = useTranslation('device_settings')
  const navigate = useNavigate()

  const onLinkClick = (): void => {
    navigate(`/devices/${robotName}/#recent-protocol-runs`)
  }

  return (
    <InlineNotification
      type="alert"
      heading={t('image_storage_almost_full')}
      message={t('free_disk_space')}
      linkText={t('view_recent_runs')}
      onLinkClick={onLinkClick}
    />
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
  cameraConfirmed: boolean
}

function CameraStatus({
  toggleCameraEnabled,
  isCameraEnabled,
  cameraConfirmed,
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
          disabled={cameraConfirmed}
        />
      </div>
    </div>
  )
}
