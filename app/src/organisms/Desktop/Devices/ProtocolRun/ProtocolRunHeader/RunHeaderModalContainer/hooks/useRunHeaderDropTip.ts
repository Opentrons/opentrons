import { useEffect } from 'react'

import { RUN_STATUS_IDLE } from '@opentrons/api-client'
import { useErrorRecoverySettings } from '@opentrons/react-api-client'
import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'

import { lastRunCommandPromptedErrorRecovery } from '/app/local-resources/commands'
import { isTerminatingOrTerminal } from '/app/local-resources/runs/utils'
import { useDropTipWizardFlows } from '/app/organisms/DropTipWizardFlows'
import { useTipAttachmentStatus } from '/app/resources/instruments'
import { useCurrentRunCommands, useIsRunCurrent } from '/app/resources/runs'

import { useProtocolDropTipModal } from '../modals'

import type { Run, RunStatus } from '@opentrons/api-client'
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
  runRecord: Run | null
  robotType: RobotType
  runStatus: RunStatus | null
  closeCurrentRun: () => void
}

export interface UseRunHeaderDropTipResult {
  dropTipModalUtils: UseProtocolDropTipModalResult
  dropTipWizardUtils: RunHeaderDropTipWizProps
  resetTipStatus: TipAttachmentStatusResult['resetTipStatus']
  /**
   * True once tip status is known, tip check was skipped (already handled in
   * error recovery), or the robot is OT-2 (no tip check). Used to avoid
   * showing post-run modals (e.g. SignRun) before drop-tip can claim the UI.
   */
  isPostRunTipStatusSettled: boolean
}

// Handles all the tip related logic during a protocol run on the desktop app.
export function useRunHeaderDropTip({
  runId,
  runRecord,
  robotType,
  runStatus,
  closeCurrentRun,
}: UseRunHeaderDropTipParams): UseRunHeaderDropTipResult {
  const isRunCurrent = useIsRunCurrent(runId)
  const enteredER = runRecord?.data.hasEverEnteredErrorRecovery ?? false

  // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const { showDTWiz, disableDTWiz, enableDTWiz } = useDropTipWizardFlows()

  const {
    areTipsAttached,
    determineTipStatus,
    resetTipStatus,
    setTipStatusResolved,
    aPipetteWithTip,
    initialPipettesWithTipsCount,
  } = useTipAttachmentStatus({
    runId,
    runRecord: runRecord ?? null,
  })

  const dropTipModalUtils = useProtocolDropTipModal({
    areTipsAttached,
    enableDTWiz,
    isRunCurrent,
    currentRunId: runId,
    pipetteInfo: buildPipetteDetails(aPipetteWithTip),
    onSkipAndHome: () => {
      closeCurrentRun()
    },
  })

  // The onCloseFlow for Drop Tip Wizard
  const onCloseFlow = (isTakeover?: boolean): void => {
    if (isTakeover) {
      disableDTWiz()
    } else {
      void setTipStatusResolved(() => {
        disableDTWiz()
        closeCurrentRun()
      }, disableDTWiz)
    }
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
  const runSummaryNoFixit = useCurrentRunCommands(
    {
      includeFixitCommands: false,
      pageLength: 1,
    },
    { enabled: isRunTerminatingOrTerminal }
  )
  const tipCheckSkippedBecauseER =
    runSummaryNoFixit != null &&
    lastRunCommandPromptedErrorRecovery(runSummaryNoFixit, isEREnabled)
  const isPostRunTipStatusSettled =
    robotType === OT2_ROBOT_TYPE ||
    tipCheckSkippedBecauseER ||
    initialPipettesWithTipsCount !== null

  // Manage tip checking
  useEffect(
    () => {
      // If a user begins a new run without navigating away from the run page, reset tip status.
      if (robotType === FLEX_ROBOT_TYPE) {
        if (runStatus === RUN_STATUS_IDLE) {
          resetTipStatus()
        }
        // Only run tip checking if it wasn't *just* handled during Error Recovery.
        else if (
          runSummaryNoFixit != null &&
          !tipCheckSkippedBecauseER &&
          isRunCurrent &&
          isRunTerminatingOrTerminal
        ) {
          void determineTipStatus()
        }
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [runStatus, robotType, isRunCurrent, runSummaryNoFixit, isEREnabled]
  )

  // If the run terminates, close the run if no tips need handling. This marks
  // the robot as "not busy" when drop tip CTAs are unnecessary, and is also
  // the trigger for gated post-run flows (e.g. SignRun on cancel, where there
  // is no terminal banner close button).
  // Include closeCurrentRun so a gated close retries after the gate opens.
  // Include tipCheckSkippedBecauseER: tip check is intentionally skipped after
  // ER, but without this the close never fires and SignRun never opens.
  useEffect(() => {
    if (
      isRunTerminatingOrTerminal &&
      isRunCurrent &&
      (initialPipettesWithTipsCount === 0 ||
        robotType === OT2_ROBOT_TYPE ||
        tipCheckSkippedBecauseER)
    ) {
      closeCurrentRun()
    }
  }, [
    isRunTerminatingOrTerminal,
    isRunCurrent,
    enteredER,
    initialPipettesWithTipsCount,
    robotType,
    tipCheckSkippedBecauseER,
    closeCurrentRun,
  ])

  return {
    dropTipModalUtils,
    dropTipWizardUtils: buildDTWizUtils(),
    resetTipStatus,
    isPostRunTipStatusSettled,
  }
}

// TODO(jh, 09-12-24): Consolidate this with the same utility that exists elsewhere.
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
