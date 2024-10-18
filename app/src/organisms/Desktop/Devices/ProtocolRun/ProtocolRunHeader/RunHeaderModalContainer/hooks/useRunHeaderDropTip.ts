import { useEffect } from 'react'

import { useHost } from '@opentrons/react-api-client'
import { RUN_STATUS_IDLE, RUN_STATUS_STOPPED } from '@opentrons/api-client'
import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'

import {
  useDropTipWizardFlows,
  useTipAttachmentStatus,
} from '/app/organisms/DropTipWizardFlows'
import { useProtocolDropTipModal } from '../modals'
import { useCloseCurrentRun, useIsRunCurrent } from '/app/resources/runs'
import { isTerminalRunStatus } from '../../utils'

import type { RobotType } from '@opentrons/shared-data'
import type { Run, RunStatus } from '@opentrons/api-client'
import type {
  DropTipWizardFlowsProps,
  PipetteWithTip,
} from '/app/organisms/DropTipWizardFlows'
import type { UseProtocolDropTipModalResult } from '../modals'
import type { PipetteDetails } from '/app/resources/maintenance_runs'

export type RunHeaderDropTipWizProps =
  | { showDTWiz: true; dtWizProps: DropTipWizardFlowsProps }
  | { showDTWiz: false; dtWizProps: null }

export interface UseRunHeaderDropTipParams {
  runId: string
  runRecord: Run | null
  robotType: RobotType
  runStatus: RunStatus | null
}

export interface UseRunHeaderDropTipResult {
  dropTipModalUtils: UseProtocolDropTipModalResult
  dropTipWizardUtils: RunHeaderDropTipWizProps
}

// Handles all the tip related logic during a protocol run on the desktop app.
export function useRunHeaderDropTip({
  runId,
  runRecord,
  robotType,
  runStatus,
}: UseRunHeaderDropTipParams): UseRunHeaderDropTipResult {
  const host = useHost()
  const isRunCurrent = useIsRunCurrent(runId)
  const enteredER = runRecord?.data.hasEverEnteredErrorRecovery ?? false

  const { closeCurrentRun } = useCloseCurrentRun()
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
    host,
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

  // Manage tip checking
  useEffect(() => {
    // If a user begins a new run without navigating away from the run page, reset tip status.
    if (robotType === FLEX_ROBOT_TYPE) {
      if (runStatus === RUN_STATUS_IDLE) {
        resetTipStatus()
      }
      // Only determine tip status when necessary as this can be an expensive operation. Error Recovery handles tips, so don't
      // have to do it here if done during Error Recovery.
      else if (isTerminalRunStatus(runStatus) && !enteredER) {
        void determineTipStatus()
      }
    }
  }, [runStatus, robotType, enteredER])

  // TODO(jh, 08-15-24): The enteredER condition is a hack, because errorCommands are only returned when a run is current.
  // Ideally the run should not need to be current to view errorCommands.

  // If the run terminates with a "stopped" status, close the run if no tips are attached after running tip check at least once.
  // This marks the robot as "not busy" if drop tip CTAs are unnecessary.
  useEffect(() => {
    if (
      runStatus === RUN_STATUS_STOPPED &&
      isRunCurrent &&
      (initialPipettesWithTipsCount === 0 || robotType === OT2_ROBOT_TYPE) &&
      !enteredER
    ) {
      closeCurrentRun()
    }
  }, [runStatus, isRunCurrent, enteredER, initialPipettesWithTipsCount])

  return { dropTipModalUtils, dropTipWizardUtils: buildDTWizUtils() }
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
