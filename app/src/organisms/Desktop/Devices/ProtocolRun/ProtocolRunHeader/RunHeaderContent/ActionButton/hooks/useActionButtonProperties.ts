import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { RUN_STATUS_IDLE } from '@opentrons/api-client'
import { useAddCameraSettingsToRunMutation } from '@opentrons/react-api-client'

import { useLinkedDocumentationState } from '/app/local-resources/access-control/useLinkedDocumentationState'
import {
  isModuleConfirmationStatus,
  isRunAgainStatus,
  isRunningOrRecoveryStatus,
  isStartRunStatus,
  isStopRequestedStatus,
} from '/app/local-resources/runs/utils'
import { useIsHeaterShakerInProtocol } from '/app/organisms/ModuleCard/hooks'
import { useToaster } from '/app/organisms/ToasterOven'
import { useTrackProtocolRunEvent } from '/app/redux-resources/analytics'
import {
  SOURCE_RUN_RECORD,
  useCameraAnalytics,
} from '/app/redux-resources/analytics/'
import { useRobotType } from '/app/redux-resources/robots'
import {
  ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
  ANALYTICS_PROTOCOL_RUN_ACTION,
  useTrackEvent,
} from '/app/redux/analytics'
import {
  getCameraUsageState,
  getMissingSetupSteps,
} from '/app/redux/protocol-runs'
import { useIsRobotOutOfStorage } from '/app/resources/devices'

import { useRunHeaderRunControls } from '../../../hooks'
import { isAnyHeaterShakerShaking } from '../../../RunHeaderModalContainer/modals'
import { useActionBtnDisabledUtils } from './useActionBtnDisabledUtils'

import type { Dispatch, SetStateAction } from 'react'
import type { IconName } from '@opentrons/components'
import type { DocumentedAction } from '@opentrons/react-api-client'
import type { StepKey } from '/app/redux/protocol-runs'
import type { State } from '/app/redux/types'
import type { BaseActionButtonProps } from '..'

interface UseButtonPropertiesProps extends BaseActionButtonProps {
  isProtocolNotReady: boolean
  confirmMissingSteps: () => void
  confirmAttachment: () => void
  robotAnalyticsData: any
  robotSerialNumber: string
  currentRunId: string | null
  isValidRunAgain: boolean
  isOtherRunCurrent: boolean
  isRobotOnWrongVersionOfSoftware: boolean
  areCameraPreferencesConfirmed: boolean
  isClosingCurrentRun: boolean
  isCameraReadyToRun: boolean
  setShowRobotOutOfStorageModal: Dispatch<SetStateAction<boolean>>
}

// Returns ActionButton properties.
export function useActionButtonProperties({
  isProtocolNotReady,
  runStatus,
  robotName,
  runId,
  currentRunId,
  isOtherRunCurrent,
  isRobotOnWrongVersionOfSoftware,
  confirmAttachment,
  confirmMissingSteps,
  makeHandleJumpToStep,
  runRecord,
  robotAnalyticsData,
  robotSerialNumber,
  attachedModules,
  runHeaderModalContainerUtils,
  isResetRunLoadingRef,
  isClosingCurrentRun,
  areCameraPreferencesConfirmed,
  isValidRunAgain,
  protocolRunHeaderRef,
  isCameraReadyToRun,
  setShowRobotOutOfStorageModal,
}: UseButtonPropertiesProps): {
  buttonText: string
  handleButtonClick: () => void
  buttonIconName: IconName | null
} {
  const { t } = useTranslation(['run_details', 'shared'])

  const { trackProtocolRunEvent } = useTrackProtocolRunEvent(runId, robotName)
  const robotType = useRobotType(robotName)
  const { reportCameraEnablementSettings } = useCameraAnalytics({
    source: SOURCE_RUN_RECORD,
    robotType: robotType,
  })
  const isHeaterShakerInProtocol = useIsHeaterShakerInProtocol()
  const isHeaterShakerShaking = isAnyHeaterShakerShaking(attachedModules)
  const trackEvent = useTrackEvent()
  const missingSetupSteps = useSelector<State, StepKey[]>((state: State) =>
    getMissingSetupSteps(state, runId)
  )

  const actionsToDocument: DocumentedAction[] = useMemo(
    () =>
      !areCameraPreferencesConfirmed
        ? ['update_camera_settings_for_run', 'play_run']
        : ['play_run'],
    [areCameraPreferencesConfirmed]
  )
  const { documentationState: linkedDocumentationState } =
    useLinkedDocumentationState(actionsToDocument, runId)

  const protocolRunControls = useRunHeaderRunControls(
    runId,
    robotName,
    linkedDocumentationState
  )
  const { play, pause, reset } = protocolRunControls

  const { addCameraSettingsToRun } = useAddCameraSettingsToRunMutation(
    linkedDocumentationState
  )
  const runCameraSettings = useSelector((state: State) =>
    getCameraUsageState(state, runId)
  )
  let buttonText = ''
  let handleButtonClick = (): void => {}
  let buttonIconName: IconName | null = null

  const isRobotOutOfMemory = useIsRobotOutOfStorage()

  const handlePlay = (): void => {
    play()
    trackProtocolRunEvent({
      name:
        runStatus === RUN_STATUS_IDLE
          ? ANALYTICS_PROTOCOL_RUN_ACTION.START
          : ANALYTICS_PROTOCOL_RUN_ACTION.RESUME,
      properties:
        runStatus === RUN_STATUS_IDLE && robotAnalyticsData != null
          ? robotAnalyticsData
          : {},
    })
    const { enabled, recoveryEnabled, liveStreamEnabled } = runCameraSettings
    reportCameraEnablementSettings({
      cameraEnabled: enabled,
      liveFeedEnabled: liveStreamEnabled,
      recoveryCaptureEnabled: recoveryEnabled,
    })
  }
  const isSetupComplete = !missingSetupSteps || missingSetupSteps.length === 0
  const { makeSnackbar } = useToaster()
  const { isDisabled, disabledReason } = useActionBtnDisabledUtils({
    robotName,
    runId,
    isValidRunAgain,
    isSetupComplete,
    isOtherRunCurrent,
    isProtocolNotReady,
    isRobotOnWrongVersionOfSoftware,
    isClosingCurrentRun,
    makeHandleJumpToStep,
    runRecord,
    runStatus,
    isResetRunLoadingRef,
    protocolRunHeaderRef,
    attachedModules,
    protocolRunControls,
    runHeaderModalContainerUtils,
    isCameraReadyToRun,
    numberOfAtomicCommands: 0,
  })

  if (isProtocolNotReady) {
    buttonIconName = 'ot-spinner'
    buttonText = t('analyzing_on_robot')
  } else if (isClosingCurrentRun) {
    buttonIconName = 'ot-spinner'
    buttonText = t('shared:robot_is_busy')
  } else if (isRunningOrRecoveryStatus(runStatus)) {
    buttonIconName = 'pause'
    buttonText = t('pause_run')
    handleButtonClick = () => {
      pause()
      trackProtocolRunEvent({ name: ANALYTICS_PROTOCOL_RUN_ACTION.PAUSE })
    }
  } else if (isStopRequestedStatus(runStatus)) {
    buttonIconName = 'ot-spinner'
    buttonText = t('canceling_run')
  } else if (isStartRunStatus(runStatus)) {
    buttonIconName = 'play'
    buttonText =
      runStatus === RUN_STATUS_IDLE ? t('start_run') : t('resume_run')
    handleButtonClick = () => {
      if (isDisabled && disabledReason) {
        makeSnackbar(disabledReason)
        return
      }
      if (isHeaterShakerShaking && isHeaterShakerInProtocol) {
        runHeaderModalContainerUtils.HSRunningModalUtils.toggleModal?.()
      } else if (
        missingSetupSteps.length !== 0 &&
        isModuleConfirmationStatus(runStatus)
      ) {
        confirmMissingSteps()
      } else if (
        isHeaterShakerInProtocol &&
        !isHeaterShakerShaking &&
        isModuleConfirmationStatus(runStatus)
      ) {
        confirmAttachment()
      }
      // Camera settings do not require explicit confirmation by *any* user,
      // so if the settings haven't been confirmed, use this user's settings
      // before starting the run.
      else if (!areCameraPreferencesConfirmed) {
        const { enabled, recoveryEnabled, liveStreamEnabled } =
          runCameraSettings

        addCameraSettingsToRun(
          {
            runId,
            settings: {
              liveStreamEnabled,
              cameraEnabled: enabled,
              errorRecoveryCameraEnabled: recoveryEnabled,
            },
          },
          { onSettled: handlePlay }
        )
      } else if (isRobotOutOfMemory) {
        setShowRobotOutOfStorageModal(true)
      } else {
        handlePlay()
      }
    }
  } else if (isRunAgainStatus(runStatus)) {
    buttonIconName = isResetRunLoadingRef.current ? 'ot-spinner' : 'play'
    buttonText = t('run_again')
    handleButtonClick = () => {
      if (isRobotOutOfMemory) {
        setShowRobotOutOfStorageModal(true)
        return
      }

      isResetRunLoadingRef.current = true
      reset({
        onError: () => {
          // e.g. user cancelled the documentation modal
          isResetRunLoadingRef.current = false
        },
      })
      runHeaderModalContainerUtils.dropTipUtils.resetTipStatus()
      trackEvent({
        name: ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
        properties: { sourceLocation: 'RunRecordDetail', robotSerialNumber },
      })
      trackProtocolRunEvent({
        name: ANALYTICS_PROTOCOL_RUN_ACTION.AGAIN,
      })
    }
  }
  return { buttonText, handleButtonClick, buttonIconName }
}
