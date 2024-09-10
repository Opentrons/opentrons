import * as React from 'react'

import { ErrorRecoveryFlows } from '../../../../ErrorRecoveryFlows'
import { DropTipWizardFlows } from '../../../../DropTipWizardFlows'
import { useMostRecentCompletedAnalysis } from '../../../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import {
  ConfirmCancelModal,
  HeaterShakerIsRunningModal,
  ProtocolAnalysisErrorModal,
  ProtocolDropTipModal,
  RunFailedModal,
  ConfirmMissingStepsModal,
} from './modals'
import { ConfirmAttachmentModal } from '../../../../ModuleCard/ConfirmAttachmentModal'

import type { RunStatus } from '@opentrons/api-client'
import type { RunControls } from '../../../../RunTimeControl/hooks'
import type { UseRunErrorsResult } from '../hooks'
import type { UseRunHeaderModalContainerResult } from '.'

export interface RunHeaderModalContainerProps {
  runId: string
  runStatus: RunStatus | null
  robotName: string
  protocolRunControls: RunControls
  runHeaderModalContainerUtils: UseRunHeaderModalContainerResult
  runErrors: UseRunErrorsResult
}

// Contains all the various modals that render in ProtocolRunHeader.
export function RunHeaderModalContainer(
  props: RunHeaderModalContainerProps
): JSX.Element | null {
  const { runId, runStatus, runHeaderModalContainerUtils } = props
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
  } = runHeaderModalContainerUtils
  const { dropTipModalUtils, dropTipWizardUtils } = dropTipUtils

  return (
    <>
      {recoveryModalUtils.isERActive ? (
        <ErrorRecoveryFlows
          runStatus={runStatus}
          runId={runId}
          failedCommandByRunRecord={recoveryModalUtils.failedCommand}
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
          startRun={props.protocolRunControls.play}
        />
      ) : null}
      {HSConfirmationModalUtils.showModal && (
        <ConfirmAttachmentModal {...HSConfirmationModalUtils.modalProps} />
      )}
      {missingStepsModalUtils.showModal && (
        <ConfirmMissingStepsModal {...missingStepsModalUtils.modalProps} />
      )}
    </>
  )
}
