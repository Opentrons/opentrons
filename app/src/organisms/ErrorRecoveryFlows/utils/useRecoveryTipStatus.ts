import * as React from 'react'

import { useHost, useInstrumentsQuery } from '@opentrons/react-api-client'

import { useTipAttachmentStatus } from '../../DropTipWizardFlows'
import { useIsFlex } from '../../Devices/hooks'
import { useNotifyRunQuery } from '../../../resources/runs'

import type {
  TipAttachmentStatusResult,
  PipetteWithTip,
} from '../../DropTipWizardFlows'

export interface RecoveryTipStatusUtils {
  isLoadingTipStatus: boolean
  areTipsAttached: boolean
  determineTipStatus: () => Promise<PipetteWithTip[]>
  pipettesWithTip: TipAttachmentStatusResult['pipettesWithTip']
}

export function useRecoveryTipStatus(runId: string): RecoveryTipStatusUtils {
  const [isLoadingTipStatus, setIsLoadingTipStatus] = React.useState(false)
  const host = useHost()
  const isFlex = useIsFlex(host?.robotName ?? '') // Safe to return an empty string - tip presence sensors won't be used.

  const { data: runRecord } = useNotifyRunQuery(runId)
  const { data: attachedInstruments } = useInstrumentsQuery()

  const {
    determineTipStatus,
    pipettesWithTip,
    areTipsAttached,
  } = useTipAttachmentStatus({
    runId,
    host,
    runRecord,
    attachedInstruments,
    isFlex,
  })

  const determineTipStatusWithLoading = (): Promise<PipetteWithTip[]> => {
    setIsLoadingTipStatus(true)

    return determineTipStatus().then(pipettesWithTips => {
      setIsLoadingTipStatus(false)

      return Promise.resolve(pipettesWithTips)
    })
  }

  return {
    determineTipStatus: determineTipStatusWithLoading,
    pipettesWithTip,
    isLoadingTipStatus,
    areTipsAttached,
  }
}
