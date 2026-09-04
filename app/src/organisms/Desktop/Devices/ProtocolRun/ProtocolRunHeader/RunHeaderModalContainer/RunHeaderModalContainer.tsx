import { DropTipWizardFlows } from '/app/organisms/DropTipWizardFlows'
import { ErrorRecoveryFlows } from '/app/organisms/ErrorRecoveryFlows'
import { LabwareOffsetsConflictModal } from '/app/organisms/LabwareOffsetsConflictModal'
import { ConfirmAttachmentModal } from '/app/organisms/ModuleCard/ConfirmAttachmentModal'
import { useMostRecentCompletedAnalysis } from '/app/resources/runs'

import {
  ConfirmCancelModal,
  ConfirmMissingStepsModal,
  HeaterShakerIsRunningModal,
  ProtocolAnalysisErrorModal,
  ProtocolDropTipModal,
  RunFailedModal,
} from './modals'

import type { RunStatus } from '@opentrons/api-client'
import type { UseRunHeaderModalContainerResult } from '.'
import type { UseRunErrorsResult } from '../hooks'

export interface RunHeaderModalContainerProps {
  runId: string
  runStatus: RunStatus | null
  robotName: string
  runHeaderModalContainerUtils: UseRunHeaderModalContainerResult
  runErrors: UseRunErrorsResult
}

// Contains all the various modals that render in ProtocolRunHeader.
export function RunHeaderModalContainer(
  props: RunHeaderModalContainerProps
): JSX.Element | null {
  const { runId, runStatus, runHeaderModalContainerUtils, robotName } = props
  const robotProtocolAnalysis = useMostRecentCompletedAnalysis(runId)

  const {
    confirmCancelModalUtils,
    analysisErrorModalUtils,
    HSConfirmationModalUtils,
    HSRunningModalUtils,
    runFailedModalUtils,
    recoveryModalUtils,
    missingStepsModalUtils,
    dropTipUtils,
    offsetConflictModalUtils,
  } = runHeaderModalContainerUtils
  const { dropTipModalUtils, dropTipWizardUtils } = dropTipUtils

  // TODO(jh, 09-10-24): Instead of having each modal be responsible for its own portal, do all the portaling here.
  return (
    <>
      {recoveryModalUtils.isERActive ? (
        <ErrorRecoveryFlows
          runStatus={runStatus}
          runId={runId}
          unvalidatedFailedCommand={recoveryModalUtils.failedCommand}
          runLwDefsByUri={recoveryModalUtils.runLwDefsByUri}
          protocolAnalysis={robotProtocolAnalysis}
        />
      ) : null}
      {runFailedModalUtils.showRunFailedModal ? (
        <RunFailedModal
          toggleModal={runFailedModalUtils.toggleModal}
          {...props}
        />
      ) : null}
      {confirmCancelModalUtils.showModal ? (
        <ConfirmCancelModal
          onClose={confirmCancelModalUtils.toggleModal}
          {...props}
        />
      ) : null}
      {dropTipWizardUtils.showDTWiz ? (
        <DropTipWizardFlows {...dropTipWizardUtils.dtWizProps} />
      ) : null}
      {analysisErrorModalUtils.showModal ? (
        <ProtocolAnalysisErrorModal {...analysisErrorModalUtils.modalProps} />
      ) : null}
      {dropTipModalUtils.showModal ? (
        <ProtocolDropTipModal {...dropTipModalUtils.modalProps} />
      ) : null}
      {HSRunningModalUtils.showModal ? (
        <HeaterShakerIsRunningModal
          closeModal={HSRunningModalUtils.toggleModal}
          module={HSRunningModalUtils.module}
          runId={runId}
          robotName={robotName}
        />
      ) : null}
      {HSConfirmationModalUtils.showModal && (
        <ConfirmAttachmentModal {...HSConfirmationModalUtils.modalProps} />
      )}
      {missingStepsModalUtils.showModal && (
        <ConfirmMissingStepsModal {...missingStepsModalUtils.modalProps} />
      )}
      {offsetConflictModalUtils.showModal && (
        <LabwareOffsetsConflictModal {...props} isOnDevice={false} />
      )}
    </>
  )
}
