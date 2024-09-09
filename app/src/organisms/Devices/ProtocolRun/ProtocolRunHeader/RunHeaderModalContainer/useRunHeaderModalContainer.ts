import {
  useConfirmCancelModal,
  useHeaterShakerIsRunningModal,
  useProtocolAnalysisErrorsModal,
  useRunFailedModal,
} from './modals'
import {
  useHeaterShakerConfirmationModal,
  useMissingStepsModal,
  useRunHeaderDropTip,
} from './hooks'
import { useErrorRecoveryFlows } from '../../../../ErrorRecoveryFlows'
import {
  useProtocolDetailsForRun,
  useRobot,
  useRobotType,
} from '../../../hooks'
import { getFallbackRobotSerialNumber } from '../utils'
import {
  ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
  useTrackEvent,
} from '../../../../../redux/analytics'

import type { AttachedModule, RunStatus, Run } from '@opentrons/api-client'
import type { UseErrorRecoveryResult } from '../../../../ErrorRecoveryFlows'
import type {
  UseRunHeaderDropTipResult,
  UseMissingStepsModalResult,
  UseHeaterShakerConfirmationModalResult,
} from './hooks'
import type {
  UseAnalysisErrorsModalResult,
  UseConfirmCancelModalResult,
  UseHeaterShakerIsRunningModalResult,
  UseRunFailedModalResult,
} from './modals'
import type { ProtocolRunHeaderProps } from '..'
import type { RunControls } from '../../../../RunTimeControl/hooks'

interface UseRunHeaderModalContainerProps extends ProtocolRunHeaderProps {
  attachedModules: AttachedModule[]
  protocolRunControls: RunControls
  runStatus: RunStatus | null
  runRecord: Run | null
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
}

export function useRunHeaderModalContainer({
  runId,
  robotName,
  runStatus,
  runRecord,
  attachedModules,
  missingSetupSteps,
  protocolRunControls,
}: UseRunHeaderModalContainerProps): UseRunHeaderModalContainerResult {
  const { displayName } = useProtocolDetailsForRun(runId)
  const robot = useRobot(robotName)
  const robotSerialNumber = getFallbackRobotSerialNumber(robot)
  const trackEvent = useTrackEvent()
  const robotType = useRobotType(robotName)

  function handleProceedToRunClick(): void {
    trackEvent({
      name: ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
      properties: { robotSerialNumber },
    })
    protocolRunControls.play()
  }

  const confirmCancelModalUtils = useConfirmCancelModal()

  const runFailedModalUtils = useRunFailedModal()

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
    missingSetupSteps,
    handleProceedToRunClick,
  })

  const dropTipUtils = useRunHeaderDropTip({
    runId,
    runStatus,
    runRecord,
    robotType,
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
  }
}
