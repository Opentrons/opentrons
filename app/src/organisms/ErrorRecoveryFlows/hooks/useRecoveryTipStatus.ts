import * as React from 'react'

import { useHost } from '@opentrons/react-api-client'

import { useTipAttachmentStatus } from '../../DropTipWizardFlows'

import type { Run, Instruments } from '@opentrons/api-client'
import type {
  TipAttachmentStatusResult,
  PipetteWithTip,
} from '../../DropTipWizardFlows'

interface UseRecoveryTipStatusProps {
  runId: string
  isFlex: boolean
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
  const [isLoadingTipStatus, setIsLoadingTipStatus] = React.useState(false)
  const host = useHost()

  const tipAttachmentStatusUtils = useTipAttachmentStatus({
    ...props,
    host,
  })

  const determineTipStatusWithLoading = (): Promise<PipetteWithTip[]> => {
    const { determineTipStatus } = tipAttachmentStatusUtils
    setIsLoadingTipStatus(true)

    return determineTipStatus().then(pipettesWithTips => {
      setIsLoadingTipStatus(false)

      return Promise.resolve(pipettesWithTips)
    })
  }

  return {
    ...tipAttachmentStatusUtils,
    determineTipStatus: determineTipStatusWithLoading,
    isLoadingTipStatus,
    runId: props.runId,
  }
}
