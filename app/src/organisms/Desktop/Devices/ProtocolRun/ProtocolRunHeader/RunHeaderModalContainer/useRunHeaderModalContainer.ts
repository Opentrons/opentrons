import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { useErrorRecoveryFlows } from '/app/organisms/ErrorRecoveryFlows'
import { useApplyOffsets } from '/app/organisms/LabwarePositionCheck'
import {
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
  OFFSETS_CONFLICT,
  selectAreOffsetsApplied,
  selectOffsetSource,
} from '/app/redux/protocol-runs'
import { useCurrentRunId, useProtocolDetailsForRun } from '/app/resources/runs'

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

  const { displayName } = useProtocolDetailsForRun(runId)
  const robot = useRobot(robotName)
  const robotSerialNumber = getFallbackRobotSerialNumber(robot)
  const trackEvent = useTrackEvent()
  const { trackProtocolRunEvent } = useTrackProtocolRunEvent(runId, robotName)
  const robotType = useRobotType(robotName)
  const robotAnalyticsData = useRobotAnalyticsData(robotName)
  const isLabwareOffsetConflict =
    useSelector(selectOffsetSource(runId)) === OFFSETS_CONFLICT
  const isThisRunCurrent = runId === useCurrentRunId()
  const flexOffsetsApplied = useSelector(selectAreOffsetsApplied(runId))
  const { applyOffsets, isApplyingOffsets } = useApplyOffsets(runId)

  function proceedToRun(): void {
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

  function handleProceedToRunClick(): Promise<void> {
    if (robotType === FLEX_ROBOT_TYPE && !flexOffsetsApplied) {
      return applyOffsets().then(proceedToRun)
    } else {
      proceedToRun()
      return Promise.resolve()
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
