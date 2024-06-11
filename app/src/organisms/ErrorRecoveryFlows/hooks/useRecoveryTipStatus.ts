import * as React from 'react'

import { useHost, useInstrumentsQuery } from '@opentrons/react-api-client'

import { useTipAttachmentStatus } from '../../DropTipWizardFlows'
import { useNotifyRunQuery } from '../../../resources/runs'

import type {
  TipAttachmentStatusResult,
  PipetteWithTip,
} from '../../DropTipWizardFlows'

export type RecoveryTipStatusUtils = TipAttachmentStatusResult & {
  /* Whether the robot is currently determineTipStatus() */
  isLoadingTipStatus: boolean
  runId: string
}

// Wraps the tip attachment status utils with Error Recovery specific states and values.
export function useRecoveryTipStatus(
  runId: string,
  isFlex: boolean
): RecoveryTipStatusUtils {
  const [isLoadingTipStatus, setIsLoadingTipStatus] = React.useState(false)
  const host = useHost()

  const { data: runRecord } = useNotifyRunQuery(runId)
  const { data: attachedInstruments } = useInstrumentsQuery()

  const tipAttachmentStatusUtils = useTipAttachmentStatus({
    runId,
    host,
    runRecord,
    attachedInstruments,
    isFlex,
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
    runId,
  }
}
