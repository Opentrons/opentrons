import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { useAddCameraSettingsToRunMutation } from '@opentrons/react-api-client'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { useErrorRecoveryFlows } from '/app/organisms/ErrorRecoveryFlows'
import { useApplyOffsets } from '/app/organisms/LabwarePositionCheck'
import {
  SOURCE_RUN_RECORD,
  useCameraAnalytics,
  useRobotAnalyticsData,
  useTrackProtocolRunEvent,
} from '/app/redux-resources/analytics'
import { useRobot, useRobotType } from '/app/redux-resources/robots'
import {
  ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
  ANALYTICS_PROTOCOL_RUN_ACTION,
  useTrackEvent,
} from '/app/redux/analytics'
import {
  getCameraUsageState,
  OFFSETS_CONFLICT,
  selectAreOffsetsApplied,
  selectOffsetSource,
} from '/app/redux/protocol-runs'
import {
  useCurrentRunId,
  useQuickProtocolDetailsForRun,
} from '/app/resources/runs'

import { getFallbackRobotSerialNumber } from '../utils'
import {
  useHeaterShakerConfirmationModal,
  useMissingStepsModal,
  useRunHeaderDropTip,
} from './hooks'
import {
  useConfirmCancelModal,
  useHeaterShakerIsRunningModal,
  useProtocolAnalysisErrorsModal,
  useRunFailedModal,
} from './modals'

import type { AttachedModule, Run, RunStatus } from '@opentrons/api-client'
import type { UseErrorRecoveryResult } from '/app/organisms/ErrorRecoveryFlows'
import type { RunControls } from '/app/organisms/RunTimeControl'
import type { State } from '/app/redux/types'
import type { ProtocolRunHeaderProps } from '..'
import type { UseRunErrorsResult } from '../hooks'
import type {
  UseHeaterShakerConfirmationModalResult,
  UseMissingStepsModalResult,
  UseRunHeaderDropTipResult,
} from './hooks'
import type {
  UseAnalysisErrorsModalResult,
  UseConfirmCancelModalResult,
  UseHeaterShakerIsRunningModalResult,
  UseRunFailedModalResult,
} from './modals'

interface OffsetCOnflictModalUtils {
  showModal: boolean
}

interface UseRunHeaderModalContainerProps extends ProtocolRunHeaderProps {
  attachedModules: AttachedModule[]
  protocolRunControls: RunControls
  runStatus: RunStatus | null
  runRecord: Run | null
  runErrors: UseRunErrorsResult
  closeCurrentRun: () => void
}

export interface UseRunHeaderModalContainerResult {
  confirmCancelModalUtils: UseConfirmCancelModalResult
  runFailedModalUtils: UseRunFailedModalResult
  analysisErrorModalUtils: UseAnalysisErrorsModalResult
  HSRunningModalUtils: UseHeaterShakerIsRunningModalResult
  HSConfirmationModalUtils: UseHeaterShakerConfirmationModalResult
  missingStepsModalUtils: UseMissingStepsModalResult
  dropTipUtils: UseRunHeaderDropTipResult
  recoveryModalUtils: UseErrorRecoveryResult
  offsetConflictModalUtils: OffsetCOnflictModalUtils
}

// Provides all the utilities used by the various modals that render in ProtocolRunHeader.
export function useRunHeaderModalContainer({
  runId,
  robotName,
  runStatus,
  runRecord,
  attachedModules,
  protocolRunControls,
  runErrors,
  closeCurrentRun,
}: UseRunHeaderModalContainerProps): UseRunHeaderModalContainerResult {
  const navigate = useNavigate()

  const { displayName } = useQuickProtocolDetailsForRun(runId)
  const robot = useRobot(robotName)
  const robotSerialNumber = getFallbackRobotSerialNumber(robot)
  const trackEvent = useTrackEvent()
  const { trackProtocolRunEvent } = useTrackProtocolRunEvent(runId, robotName)
  const robotType = useRobotType(robotName)
  const { reportCameraEnablementSettings } = useCameraAnalytics({
    source: SOURCE_RUN_RECORD,
    robotType: robotType,
  })
  const robotAnalyticsData = useRobotAnalyticsData(robotName)
  const isLabwareOffsetConflict =
    useSelector(selectOffsetSource(runId)) === OFFSETS_CONFLICT
  const isThisRunCurrent = runId === useCurrentRunId()
  const flexOffsetsApplied = useSelector(selectAreOffsetsApplied(runId))
  const areCameraPreferencesConfirmed = runRecord?.data.cameraSettings != null
  const documentationState = useDocumentationState()
  const { applyOffsets, isApplyingOffsets } = useApplyOffsets(
    runId,
    documentationState
  )
  const { mutateAsync: addCameraSettingsToRun } =
    useAddCameraSettingsToRunMutation(documentationState)
  const runCameraSettings = useSelector((state: State) =>
    getCameraUsageState(state, runId)
  )

  function proceedToRun(): void {
    const { enabled, recoveryEnabled, liveStreamEnabled } = runCameraSettings
    reportCameraEnablementSettings({
      cameraEnabled: enabled,
      liveFeedEnabled: liveStreamEnabled,
      recoveryCaptureEnabled: recoveryEnabled,
    })

    navigate(`/devices/${robotName}/protocol-runs/${runId}/run-preview`)
    trackEvent({
      name: ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
      properties: { robotSerialNumber },
    })
    trackProtocolRunEvent({
      name: ANALYTICS_PROTOCOL_RUN_ACTION.START,
      properties: robotAnalyticsData ?? {},
    })
    protocolRunControls.play()
  }

  const handlePlay = (): Promise<void> => {
    if (robotType === FLEX_ROBOT_TYPE && !flexOffsetsApplied) {
      return applyOffsets().then(proceedToRun)
    } else {
      proceedToRun()
      return Promise.resolve()
    }
  }

  function handleProceedToRunClick(): Promise<void> {
    // Camera settings do not require explicit confirmation by *any* user,
    // so if the settings haven't been confirmed, use this user's settings
    // before starting the run.
    const { enabled, recoveryEnabled, liveStreamEnabled } = runCameraSettings
    if (!areCameraPreferencesConfirmed) {
      return addCameraSettingsToRun({
        runId,
        settings: {
          liveStreamEnabled,
          cameraEnabled: enabled,
          errorRecoveryCameraEnabled: recoveryEnabled,
        },
      })
        .catch(error => {
          console.warn(
            'Failed to save camera settings, proceeding anyway',
            error
          )
        })
        .then(() => handlePlay())
    } else {
      return handlePlay()
    }
  }

  const confirmCancelModalUtils = useConfirmCancelModal()

  const runFailedModalUtils = useRunFailedModal(runErrors)

  const analysisErrorModalUtils = useProtocolAnalysisErrorsModal({
    robotName,
    runId,
    displayName,
  })

  const HSRunningModalUtils = useHeaterShakerIsRunningModal(attachedModules)

  const HSConfirmationModalUtils = useHeaterShakerConfirmationModal(
    handleProceedToRunClick
  )

  const missingStepsModalUtils = useMissingStepsModal({
    attachedModules,
    runStatus,
    runId,
    handleProceedToRunClick,
    isRunStarting: isApplyingOffsets,
  })

  const dropTipUtils = useRunHeaderDropTip({
    runId,
    runStatus,
    runRecord,
    robotType,
    closeCurrentRun,
  })

  const recoveryModalUtils = useErrorRecoveryFlows(runId, runStatus)

  return {
    confirmCancelModalUtils,
    analysisErrorModalUtils,
    HSConfirmationModalUtils,
    HSRunningModalUtils,
    runFailedModalUtils,
    recoveryModalUtils,
    missingStepsModalUtils,
    dropTipUtils,
    offsetConflictModalUtils: {
      showModal: isLabwareOffsetConflict && isThisRunCurrent,
    },
  }
}
