import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Chip, SPACING } from '@opentrons/components'
import { useAddCameraSettingsToRunMutation } from '@opentrons/react-api-client'

import { SmallButton } from '/app/atoms/buttons'
import { ODDBackButton } from '/app/molecules/ODDBackButton'
import { CameraSettings } from '/app/organisms/ODD/CameraSettings'

import styles from './setupcamera.module.css'

import type { Dispatch, SetStateAction } from 'react'
import type { CameraData } from '@opentrons/api-client'
import type { SetupScreens } from '/app/organisms/ODD/ProtocolSetup'
import type { RobotStorageInfo } from '/app/resources/health/useIsImageStorageLow'

export interface ProtocolSetupCameraProps {
  runId: string
  robotName: string
  isCameraRequired: boolean
  cameraSettings: CameraData | null
  runCameraSettings: CameraData | null
  cameraConfirmed: boolean
  confirmCameraSettings: () => void
  storageInfo: RobotStorageInfo | null
  setSetupScreen: Dispatch<SetStateAction<SetupScreens>>
}

export function ProtocolSetupCamera(
  props: ProtocolSetupCameraProps
): JSX.Element {
  const {
    runId,
    confirmCameraSettings,
    cameraSettings,
    cameraConfirmed,
    runCameraSettings,
  } = props
  const { t } = useTranslation('protocol_setup')
  const { addCameraSettingsToRun } = useAddCameraSettingsToRunMutation()
  const initialSettingsLoaded = cameraSettings != null
  const runSettingsLoaded = runCameraSettings != null

  const [cameraEnabled, setIsCameraEnabled] = useState(
    cameraSettings?.cameraEnabled ?? false
  )
  const [liveStreamEnabled, setLiveStreamEnabled] = useState(
    cameraSettings?.liveStreamEnabled ?? false
  )
  const [recoveryEnabled, setRecoveryEnabled] = useState(
    cameraSettings?.errorRecoveryCameraEnabled ?? false
  )

  // Populate the toggles with the run settings if they have been set,
  //  otherwise, populate the toggles with the camera settings once the network
  //  request completes.
  useEffect(() => {
    if (runCameraSettings != null) {
      const { cameraEnabled, errorRecoveryCameraEnabled, liveStreamEnabled } =
        runCameraSettings
      setIsCameraEnabled(cameraEnabled)
      setLiveStreamEnabled(liveStreamEnabled)
      setRecoveryEnabled(errorRecoveryCameraEnabled)
    } else if (cameraSettings != null) {
      const { cameraEnabled, errorRecoveryCameraEnabled, liveStreamEnabled } =
        cameraSettings
      setIsCameraEnabled(cameraEnabled)
      setLiveStreamEnabled(liveStreamEnabled)
      setRecoveryEnabled(errorRecoveryCameraEnabled)
    }
  }, [initialSettingsLoaded, runSettingsLoaded])

  const toggleCameraEnabled = (): void => {
    if (!cameraConfirmed) {
      setIsCameraEnabled(!cameraEnabled)
    }
  }

  const toggleRecoveryEnabled = (): void => {
    if (!cameraConfirmed) {
      setRecoveryEnabled(!recoveryEnabled)
    }
  }

  const toggleLiveStreamEnabled = (): void => {
    if (!cameraConfirmed) {
      setLiveStreamEnabled(!liveStreamEnabled)
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
