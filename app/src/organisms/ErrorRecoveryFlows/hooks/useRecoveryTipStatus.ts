import { useState } from 'react'
import head from 'lodash/head'

import { useHost } from '@opentrons/react-api-client'
import { getPipetteModelSpecs } from '@opentrons/shared-data'
import { useTipAttachmentStatus } from '/app/organisms/DropTipWizardFlows'

import type { Run, Instruments, PipetteData } from '@opentrons/api-client'
import type {
  PipetteWithTip,
  TipAttachmentStatusResult,
} from '/app/organisms/DropTipWizardFlows'

interface UseRecoveryTipStatusProps {
  runId: string
  failedPipetteInfo: PipetteData | null
  attachedInstruments?: Instruments
  runRecord?: Run
}

export type RecoveryTipStatusUtils = TipAttachmentStatusResult & {
  /* Whether the robot is currently determineTipStatus() */
  isLoadingTipStatus: boolean
  runId: string
}

// Wraps the tip attachment status utils with Error Recovery specific states and values.
export function useRecoveryTipStatus(
  props: UseRecoveryTipStatusProps
): RecoveryTipStatusUtils {
  const [isLoadingTipStatus, setIsLoadingTipStatus] = useState(false)
  const [
    failedCommandPipette,
    setFailedCommandPipette,
  ] = useState<PipetteWithTip | null>(null)
  const host = useHost()

  const tipAttachmentStatusUtils = useTipAttachmentStatus({
    ...props,
    host,
    runRecord: props.runRecord ?? null,
  })

  const determineTipStatusWithLoading = (): Promise<PipetteWithTip[]> => {
    const { determineTipStatus } = tipAttachmentStatusUtils
    const { failedPipetteInfo } = props
    setIsLoadingTipStatus(true)

    return determineTipStatus().then(pipettesWithTip => {
      // In cases in which determineTipStatus doesn't think a tip could be attached to any pipette, supply the pipette
      // involved in the failed command, if any.
      let failedCommandPipettes: PipetteWithTip[]
      const specs =
        failedPipetteInfo != null
          ? getPipetteModelSpecs(failedPipetteInfo.instrumentModel)
          : null

      if (
        pipettesWithTip.length === 0 &&
        failedPipetteInfo != null &&
        specs != null
      ) {
        const currentPipette: PipetteWithTip = {
          mount: failedPipetteInfo.mount,
          specs,
        }

        failedCommandPipettes = [currentPipette]
      } else {
        failedCommandPipettes = pipettesWithTip
      }

      setIsLoadingTipStatus(false)
      setFailedCommandPipette(head(failedCommandPipettes) ?? null)

      return Promise.resolve(pipettesWithTip)
    })
  }

  return {
    ...tipAttachmentStatusUtils,
    aPipetteWithTip: failedCommandPipette,
    determineTipStatus: determineTipStatusWithLoading,
    isLoadingTipStatus,
    runId: props.runId,
  }
}
