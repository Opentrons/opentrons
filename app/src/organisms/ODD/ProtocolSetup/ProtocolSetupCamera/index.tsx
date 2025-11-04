import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import { Chip, SPACING } from '@opentrons/components'
import { useAddCameraSettingsToRunMutation } from '@opentrons/react-api-client'

import { SmallButton } from '/app/atoms/buttons'
import { ODDBackButton } from '/app/molecules/ODDBackButton'
import { CameraSettings } from '/app/organisms/ODD/CameraSettings'
import {
  getCameraUsageState,
  updateCameraEnablement,
  updateCameraRecoveryEnablement,
  updateCameraStreamEnablement,
} from '/app/redux/protocol-runs'

import styles from './setupcamera.module.css'

import type { Dispatch, SetStateAction } from 'react'
import type { SetupScreens } from '/app/organisms/ODD/ProtocolSetup'
import type { State } from '/app/redux/types'
import type { RobotStorageInfo } from '/app/resources/health/useIsImageStorageLow'

export interface ProtocolSetupCameraProps {
  runId: string
  robotName: string
  isCameraRequired: boolean
  cameraConfirmed: boolean
  confirmCameraSettings: () => void
  storageInfo: RobotStorageInfo | null
  setSetupScreen: Dispatch<SetStateAction<SetupScreens>>
}

export function ProtocolSetupCamera(
  props: ProtocolSetupCameraProps
): JSX.Element {
  const { runId, confirmCameraSettings, cameraConfirmed } = props
  const { t } = useTranslation('protocol_setup')
  const dispatch = useDispatch()
  const { addCameraSettingsToRun } = useAddCameraSettingsToRunMutation()

  const {
    liveStreamEnabled,
    enabled: cameraEnabled,
    recoveryEnabled,
  } = useSelector((state: State) => getCameraUsageState(state, runId))

  const toggleCameraEnabled = (): void => {
    if (!cameraConfirmed) {
      dispatch(updateCameraEnablement(runId, !cameraEnabled))
    }
  }

  const toggleRecoveryEnabled = (): void => {
    if (!cameraConfirmed) {
      dispatch(updateCameraRecoveryEnablement(runId, !recoveryEnabled))
    }
  }

  const toggleLiveStreamEnabled = (): void => {
    if (!cameraConfirmed) {
      dispatch(updateCameraStreamEnablement(runId, !liveStreamEnabled))
    }
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
    <CameraSettings
      headerElement={
        <SetupCameraHeader
          {...props}
          onConfirmPreferences={onConfirmPreferences}
          cameraEnabled={cameraEnabled}
        />
      }
      {...props}
      isCameraEnabled={cameraEnabled}
      isLiveVideoEnabled={liveStreamEnabled}
      isRecoveryCaptureEnabled={recoveryEnabled}
      sectionHeadingText={t('review_camera_preferences')}
      storageInfo={props.storageInfo}
      toggleLiveStreamEnabled={toggleLiveStreamEnabled}
      toggleRecoveryEnabled={toggleRecoveryEnabled}
      toggleCameraEnabled={toggleCameraEnabled}
    />
  )
}

interface SetupCameraHeaderProps extends ProtocolSetupCameraProps {
  onConfirmPreferences: () => void
  cameraEnabled: boolean
}

function SetupCameraHeader({
  setSetupScreen,
  cameraConfirmed,
  onConfirmPreferences,
  cameraEnabled,
}: SetupCameraHeaderProps): JSX.Element {
  const { t } = useTranslation('protocol_setup')

  return (
    <div className={styles.header_container}>
      <ODDBackButton
        label={t('camera')}
        onClick={() => {
          setSetupScreen('prepare to run')
        }}
      />
      {cameraConfirmed ? (
        <Chip
          background
          iconName="ot-check"
          text={cameraEnabled ? t('camera_enabled') : t('camera_disabled')}
          type="success"
        />
      ) : (
        <SmallButton
          buttonText={t('confirm_preferences')}
          onClick={onConfirmPreferences}
          buttonCategory="rounded"
          padding={`${SPACING.spacing16} ${SPACING.spacing24}`}
        />
      )}
    </div>
  )
}
