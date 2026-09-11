import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import { Chip, SPACING } from '@opentrons/components'
import {
  isDocumentedMutationError,
  useAddCameraImageSettingsToRunMutation,
  useAddCameraSettingsToRunMutation,
} from '@opentrons/react-api-client'
import { OT_SYSTEM_CAMERA } from '@opentrons/shared-data'

import { SmallButton } from '/app/atoms/buttons'
import { useLinkedDocumentationState } from '/app/local-resources/access-control/useLinkedDocumentationState'
import { ODDBackButton } from '/app/molecules/ODDBackButton'
import { CameraSettings } from '/app/organisms/ODD/CameraSettings'
import { useToaster } from '/app/organisms/ToasterOven'
import {
  getCameraImageSettings,
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

const TOAST_DURATION_MS = 3000

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
  const { documentationState, clearDocreport } = useLinkedDocumentationState(
    ['update_camera_settings_for_run'],
    runId
  )
  const { mutateAsync: addCameraSettingsToRunAsync } =
    useAddCameraSettingsToRunMutation(documentationState)
  const { mutateAsync: addCameraImageSettingsToRunAsync } =
    useAddCameraImageSettingsToRunMutation(documentationState, runId)
  const { makeSnackbar } = useToaster()

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
    if (!cameraEnabled && props.isCameraRequired) {
      makeSnackbar(t('camera_required') as string, TOAST_DURATION_MS)
    } else {
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
        .catch((error: unknown) => {
          clearDocreport()
          if (isDocumentedMutationError(error)) {
            return
          }
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
  }

  return (
    <CameraSettings
      headerElement={
        <SetupCameraHeader
          {...props}
          onConfirmPreferences={onConfirmPreferences}
          cameraEnabled={cameraEnabled}
          isConfirmPending={isConfirmPending}
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
      runId={runId}
    />
  )
}

interface SetupCameraHeaderProps extends ProtocolSetupCameraProps {
  onConfirmPreferences: () => void
  cameraEnabled: boolean
  isConfirmPending: boolean
}

function SetupCameraHeader({
  setSetupScreen,
  cameraConfirmed,
  onConfirmPreferences,
  cameraEnabled,
  isConfirmPending,
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
          iconName={isConfirmPending ? 'ot-spinner' : null}
          iconPlacement={isConfirmPending ? 'startIcon' : null}
        />
      )}
    </div>
  )
}
