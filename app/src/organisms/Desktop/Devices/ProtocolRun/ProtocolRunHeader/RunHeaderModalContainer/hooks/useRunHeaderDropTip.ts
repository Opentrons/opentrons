import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { RUN_STATUS_IDLE } from '@opentrons/api-client'
import { useErrorRecoverySettings } from '@opentrons/react-api-client'

import { lastRunCommandPromptedErrorRecovery } from '/app/local-resources/commands'
import { isTerminatingOrTerminal } from '/app/local-resources/runs/utils'
import { useDropTipWizardFlows } from '/app/organisms/DropTipWizardFlows'
import {
  selectDropTipPromptDismissed,
  setDropTipPromptDismissed,
} from '/app/redux/protocol-runs'
import { useTipAttachmentStatus } from '/app/resources/instruments'
import { useMostRecentRunId, useRunCommands } from '/app/resources/runs'

import { useProtocolDropTipModal } from '../modals'

import type { RunStatus } from '@opentrons/api-client'
import type { RobotType } from '@opentrons/shared-data'
import type { DropTipWizardFlowsProps } from '/app/organisms/DropTipWizardFlows'
import type {
  PipetteWithTip,
  TipAttachmentStatusResult,
} from '/app/resources/instruments'
import type { PipetteDetails } from '/app/resources/maintenance_runs'
import type { UseProtocolDropTipModalResult } from '../modals'

export type RunHeaderDropTipWizProps =
  | { showDTWiz: true; dtWizProps: DropTipWizardFlowsProps }
  | { showDTWiz: false; dtWizProps: null }

export interface UseRunHeaderDropTipParams {
  runId: string
  robotType: RobotType
  runStatus: RunStatus | null
}

export interface UseRunHeaderDropTipResult {
  dropTipModalUtils: UseProtocolDropTipModalResult
  dropTipWizardUtils: RunHeaderDropTipWizProps
  resetTipStatus: TipAttachmentStatusResult['resetTipStatus']
}

// Handles all the tip related logic during a protocol run on the desktop app.
export function useRunHeaderDropTip({
  runId,
  robotType,
  runStatus,
}: UseRunHeaderDropTipParams): UseRunHeaderDropTipResult {
  const dispatch = useDispatch()
  const isPromptDismissed = useSelector(selectDropTipPromptDismissed(runId))
  const isMostRecentRun = useMostRecentRunId() === runId

  const { showDTWiz, disableDTWiz, enableDTWiz } = useDropTipWizardFlows()

  const { determineTipStatus, resetTipStatus, aPipetteWithTip } =
    useTipAttachmentStatus()

  const dismissDropTipPrompt = useCallback((): void => {
    dispatch(setDropTipPromptDismissed(runId))
  }, [dispatch, runId])

  const checkTipStatus = useCallback((): void => {
    void determineTipStatus().then(pipettesWithTip => {
      if (pipettesWithTip.length === 0) {
        dismissDropTipPrompt()
      }
    })
  }, [determineTipStatus, dismissDropTipPrompt])

  const dropTipModalUtils = useProtocolDropTipModal({
    hasPipetteWithTip:
      aPipetteWithTip != null && isMostRecentRun && !isPromptDismissed,
    isPromptDismissed,
    enableDTWiz,
    pipetteInfo: buildPipetteDetails(aPipetteWithTip),
    onSkipAndHome: dismissDropTipPrompt,
  })

  const onCloseFlow = (): void => {
    disableDTWiz()
    checkTipStatus()
  }

  const buildDTWizUtils = (): RunHeaderDropTipWizProps => {
    return showDTWiz && aPipetteWithTip != null
      ? {
          showDTWiz: true,
          dtWizProps: {
            robotType,
            mount: aPipetteWithTip.mount,
            instrumentModelSpecs: aPipetteWithTip.specs,
            closeFlow: onCloseFlow,
            modalStyle: 'simple',
          },
        }
      : { showDTWiz: false, dtWizProps: null }
  }

  const isRunTerminatingOrTerminal = isTerminatingOrTerminal(runStatus)
  const { data } = useErrorRecoverySettings()
  const isEREnabled = data?.data.enabled ?? true
  const runSummaryNoFixit = useRunCommands(
    runId,
    {
      includeFixitCommands: false,
      pageLength: 1,
    },
    { enabled: isRunTerminatingOrTerminal }
  )
  const tipCheckSkippedBecauseER =
    runSummaryNoFixit != null &&
    lastRunCommandPromptedErrorRecovery(runSummaryNoFixit, isEREnabled)

  useEffect(() => {
    if (runStatus === RUN_STATUS_IDLE) {
      resetTipStatus()
    } else if (
      isMostRecentRun &&
      !isPromptDismissed &&
      runSummaryNoFixit != null &&
      !tipCheckSkippedBecauseER &&
      isRunTerminatingOrTerminal
    ) {
      checkTipStatus()
    }
  }, [
    runStatus,
    isMostRecentRun,
    isPromptDismissed,
    isRunTerminatingOrTerminal,
    runSummaryNoFixit,
    tipCheckSkippedBecauseER,
    checkTipStatus,
    resetTipStatus,
  ])

  return {
    dropTipModalUtils,
    dropTipWizardUtils: buildDTWizUtils(),
    resetTipStatus,
  }
}

function buildPipetteDetails(
  aPipetteWithTip: PipetteWithTip | null
): PipetteDetails | null {
  return aPipetteWithTip != null
    ? {
        pipetteId: aPipetteWithTip.specs.name,
        mount: aPipetteWithTip.mount,
      }
    : null
}
