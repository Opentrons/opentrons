import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import {
  Chip,
  Icon,
  InlineNotification,
  PrimaryButton,
  StyledText,
} from '@opentrons/components'
import {
  useAddCameraImageSettingsToRunMutation,
  useAddCameraSettingsToRunMutation,
} from '@opentrons/react-api-client'
import { OT_SYSTEM_CAMERA } from '@opentrons/shared-data'

import { ToggleButton } from '/app/atoms/buttons'
import { useLinkedDocumentationState } from '/app/local-resources/access-control/useLinkedDocumentationState'
import { SetupRunCameraControls } from '/app/organisms/Desktop/Devices/ProtocolRun/SetupCamera/SetupRunCameraControls'
import { SetupRunCameraUsage } from '/app/organisms/Desktop/Devices/ProtocolRun/SetupCamera/SetupRunCameraSettings'
import { useToaster } from '/app/organisms/ToasterOven'
import { useIsFlex } from '/app/redux-resources/robots'
import {
  getCameraImageSettings,
  getCameraUsageState,
  updateCameraEnablement,
  updateCameraRecoveryEnablement,
  updateCameraStreamEnablement,
} from '/app/redux/protocol-runs'
import { useRobotStorageInfo } from '/app/resources/health/useIsImageStorageLow'

import styles from './setupcamera.module.css'

import type { UseCameraUsageSettingsResult } from '/app/local-resources/images/hooks/useCameraUsageSettings'
import type { State } from '/app/redux/types'

const TOAST_DURATION_MS = 3000

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
  const { makeSnackbar } = useToaster()
  const storageInfo = useRobotStorageInfo()
  const dispatch = useDispatch()
  const documentationState = useLinkedDocumentationState([
    'update_camera_settings_for_run',
  ])
  const { mutateAsync: addCameraSettingsToRunAsync } =
    useAddCameraSettingsToRunMutation(documentationState)
  const { mutateAsync: addCameraImageSettingsToRunAsync } =
    useAddCameraImageSettingsToRunMutation(documentationState, runId)
  const isFlex = useIsFlex(robotName)

  const [isConfirmPending, setIsConfirmPending] = useState(false)

  const {
    liveStreamEnabled,
    enabled: cameraEnabled,
    recoveryEnabled,
  } = useSelector((state: State) => getCameraUsageState(state, runId))
  const cameraImageSettings = useSelector((state: State) =>
    getCameraImageSettings(state, runId, OT_SYSTEM_CAMERA)
  )

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
    setIsConfirmPending(true)

    addCameraSettingsToRunAsync({
      runId,
      settings: {
        cameraEnabled,
        liveStreamEnabled,
        errorRecoveryCameraEnabled: recoveryEnabled,
      },
    })
      .then(() =>
        cameraImageSettings != null
          ? addCameraImageSettingsToRunAsync(cameraImageSettings)
          : Promise.resolve(null)
      )
      .then(confirmCameraSettings)
      .catch(() => {
        // This request only fails if the camera is not connected to the robot.
        // We only want to surface the error if a user expects the camera to be enabled.
        if (cameraEnabled) {
          makeSnackbar(
            t('error_confirming_camera') as string,
            TOAST_DURATION_MS
          )
        } else {
          confirmCameraSettings()
        }
      })
      .finally(() => {
        setIsConfirmPending(false)
      })
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
        isFlex={isFlex}
      />
      {cameraEnabled && (
        <>
          <SetupRunCameraUsage
            robotName={robotName}
            liveStreamEnabled={liveStreamEnabled}
            recoveryEnabled={recoveryEnabled}
            toggleRecoveryEnabled={toggleRecoveryEnabled}
            toggleLiveStreamEnabled={toggleLiveStreamEnabled}
            cameraConfirmed={cameraConfirmed}
          />
          <SetupRunCameraControls
            cameraConfirmed={cameraConfirmed}
            runId={runId}
          />
        </>
      )}
      <div className={styles.camera_btn_container}>
        <PrimaryButton
          onClick={onConfirmPreferences}
          disabled={cameraConfirmed}
        >
          <div className={styles.confirm_btn}>
            {isConfirmPending && (
              <Icon name="ot-spinner" spin className={styles.icon_style} />
            )}
            {t('confirm_preferences')}
          </div>
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
  isFlex: boolean
}

function CameraStatus({
  toggleCameraEnabled,
  isCameraEnabled,
  cameraConfirmed,
  isFlex,
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
            <Chip text={t('enabled')} type={'success'} hasIcon={false} />
          ) : (
            <Chip text={t('disabled')} type={'neutral'} hasIcon={false} />
          )}
        </div>
        <StyledText desktopStyle="bodyDefaultRegular">
          {isFlex
            ? t('camera_status_description_flex')
            : t('camera_status_description_ot2')}
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
