import { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { RUN_STATUS_IDLE } from '@opentrons/api-client'

import { isTerminatingOrTerminal } from '/app/local-resources/runs/utils'
import { useDropTipWizardFlows } from '/app/organisms/DropTipWizardFlows'
import {
  selectDropTipPromptDismissed,
  setDropTipPromptDismissed,
} from '/app/redux/protocol-runs'
import { useTipAttachmentStatus } from '/app/resources/instruments'
import { useMostRecentRunId } from '/app/resources/runs'

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

  const {
    determineTipStatus,
    resetTipStatus,
    skipCurrentPipette,
    aPipetteWithTip,
  } = useTipAttachmentStatus()

  const [isCheckingTips, setIsCheckingTips] = useState(false)
  const [wizardPipette, setWizardPipette] = useState<PipetteWithTip | null>(
    null
  )

  const dismissDropTipPrompt = useCallback((): void => {
    dispatch(setDropTipPromptDismissed(runId))
  }, [dispatch, runId])

  const checkTipStatus = useCallback((): void => {
    void determineTipStatus().then(pipettesWithTip => {
      setIsCheckingTips(false)
      if (pipettesWithTip.length === 0) {
        dismissDropTipPrompt()
      }
    })
  }, [determineTipStatus, dismissDropTipPrompt])

  const openWizard = (): void => {
    if (aPipetteWithTip == null) {
      return
    }
    setWizardPipette(aPipetteWithTip)
    enableDTWiz()
  }

  const dropTipModalUtils = useProtocolDropTipModal({
    hasPipetteWithTip:
      aPipetteWithTip != null &&
      isMostRecentRun &&
      !isPromptDismissed &&
      !isCheckingTips,
    isPromptDismissed,
    isWizardActive: showDTWiz || wizardPipette != null,
    enableDTWiz: openWizard,
    pipetteInfo: buildPipetteDetails(aPipetteWithTip),
    is96Channel: aPipetteWithTip?.specs.channels === 96,
    onSkipAndHome: () => {
      skipCurrentPipette()
      checkTipStatus()
    },
  })

  const onCloseFlow = (): void => {
    disableDTWiz()
    setWizardPipette(null)
    setIsCheckingTips(true)
    checkTipStatus()
  }

  const buildDTWizUtils = (): RunHeaderDropTipWizProps => {
    return showDTWiz && wizardPipette != null
      ? {
          showDTWiz: true,
          dtWizProps: {
            robotType,
            mount: wizardPipette.mount,
            instrumentModelSpecs: wizardPipette.specs,
            closeFlow: onCloseFlow,
            modalStyle: 'simple',
          },
        }
      : { showDTWiz: false, dtWizProps: null }
  }

  const isRunTerminatingOrTerminal = isTerminatingOrTerminal(runStatus)

  useEffect(() => {
    if (runStatus === RUN_STATUS_IDLE) {
      resetTipStatus()
    } else if (
      isMostRecentRun &&
      !isPromptDismissed &&
      isRunTerminatingOrTerminal &&
      !showDTWiz
    ) {
      checkTipStatus()
    }
  }, [
    runStatus,
    isMostRecentRun,
    isPromptDismissed,
    isRunTerminatingOrTerminal,
    showDTWiz,
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
