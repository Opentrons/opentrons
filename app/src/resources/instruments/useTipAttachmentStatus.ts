import { useCallback, useRef, useState } from 'react'
import head from 'lodash/head'

import { getInstruments } from '@opentrons/api-client'
import { useHost } from '@opentrons/react-api-client'
import { getPipetteModelSpecs } from '@opentrons/shared-data'

import type { InstrumentData, Mount, PipetteData } from '@opentrons/api-client'
import type { PipetteModelSpecs } from '@opentrons/shared-data'

export interface PipetteWithTip {
  mount: Mount
  specs: PipetteModelSpecs
}

interface PipetteTipState {
  specs: PipetteModelSpecs | null
  mount: Mount
  hasTip: boolean
}

export interface TipAttachmentStatusResult {
  /** Updates the pipettes with tip cache.
   *
   * NOTE: This function makes a network request on each invocation.
   * */
  determineTipStatus: () => Promise<PipetteWithTip[]>
  /* Resets the cached pipettes with tip statuses to null.  */
  resetTipStatus: () => void
  /* Ignore the current pipette on the next probe so skip can advance to another mount. */
  skipCurrentPipette: () => void
  /* Relevant pipette information for a pipette with a tip attached. If both pipettes have tips attached, return the left pipette. */
  aPipetteWithTip: PipetteWithTip | null
}

const MOUNT_ORDER: Record<Mount, number> = { left: 0, right: 1 }

// Returns various utilities for interacting with the cache of pipettes with tips attached.
export function useTipAttachmentStatus(): TipAttachmentStatusResult {
  const host = useHost()
  const [pipettesWithTip, setPipettesWithTip] = useState<PipetteWithTip[]>([])
  const skippedMountsRef = useRef<Mount[]>([])
  const currentPipetteRef = useRef<PipetteWithTip | null>(null)

  const aPipetteWithTip = head(pipettesWithTip) ?? null
  currentPipetteRef.current = aPipetteWithTip

  const skipCurrentPipette = (): void => {
    const mount = currentPipetteRef.current?.mount
    if (mount != null && !skippedMountsRef.current.includes(mount)) {
      skippedMountsRef.current = [...skippedMountsRef.current, mount]
    }
  }

  const determineTipStatus = useCallback((): Promise<PipetteWithTip[]> => {
    return getInstruments(host!)
      .then(attachedInstruments => {
        const pipettesWithTipsData = getAttachedPipettes(
          attachedInstruments?.data.data
        ).map(pipetteInfo => ({
          specs: getPipetteModelSpecs(pipetteInfo.instrumentModel),
          mount: pipetteInfo.mount,
          hasTip: pipetteInfo.state?.tipDetected === true,
        }))
        const remaining = filterPipettesWithTips(pipettesWithTipsData)
          .sort((a, b) => MOUNT_ORDER[a.mount] - MOUNT_ORDER[b.mount])
          .filter(pipette => !skippedMountsRef.current.includes(pipette.mount))

        setPipettesWithTip(remaining)

        return Promise.resolve(remaining)
      })
      .catch(e => {
        console.error(`Error during tip status check: ${e.message}`)
        return Promise.resolve([])
      })
  }, [host])

  const resetTipStatus = (): void => {
    setPipettesWithTip([])
    skippedMountsRef.current = []
  }

  return {
    determineTipStatus,
    resetTipStatus,
    skipCurrentPipette,
    aPipetteWithTip,
  }
}

const getAttachedPipettes = (
  attachedInstruments: InstrumentData[] | undefined
): PipetteData[] => {
  return (attachedInstruments ?? []).filter(
    (instr): instr is PipetteData =>
      instr.instrumentType === 'pipette' && instr.ok
  )
}

const filterPipettesWithTips = (
  pipettesWithTipsData: PipetteTipState[]
): PipetteWithTip[] => {
  return pipettesWithTipsData.filter(
    (pipette): pipette is PipetteWithTip =>
      pipette.specs != null && pipette.hasTip
  )
}
