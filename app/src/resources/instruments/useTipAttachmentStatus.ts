import { useCallback, useState } from 'react'
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

export interface PipetteTipState {
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
  /* Whether tips are attached on *any* pipette. Typically called after determineTipStatus() */
  areTipsAttached: boolean
  /* Resets the cached pipettes with tip statuses to null.  */
  resetTipStatus: () => void
  /** Removes the first element from the tip attached cache if present.
   * @param {Function} onEmptyCache After removing the pipette from the cache, if the attached tip cache is empty, invoke this callback.
   * @param {Function} onTipsDetected After removing the pipette from the cache, if the attached tip cache is not empty, invoke this callback.
   * */
  setTipStatusResolved: (
    onEmptyCache?: () => void,
    onTipsDetected?: () => void
  ) => Promise<PipetteWithTip>
  /** Clears all pipettes from the tip-attached cache without resetting the
   * settled tip-check count. Used when the user skips tip handling for the run. */
  resolveAllTips: () => void
  /* Relevant pipette information for a pipette with a tip attached. If both pipettes have tips attached, return the left pipette. */
  aPipetteWithTip: PipetteWithTip | null
  /* The initial number of pipettes with tips. Null if there has been no tip check yet. */
  initialPipettesWithTipsCount: number | null
}

const MOUNT_ORDER: Record<Mount, number> = { left: 0, right: 1 }

// Returns various utilities for interacting with the cache of pipettes with tips attached.
export function useTipAttachmentStatus(): TipAttachmentStatusResult {
  const host = useHost()
  const [pipettesWithTip, setPipettesWithTip] = useState<PipetteWithTip[]>([])
  const [initialPipettesCount, setInitialPipettesCount] = useState<
    number | null
  >(null)

  const aPipetteWithTip = head(pipettesWithTip) ?? null
  const areTipsAttached =
    pipettesWithTip.length > 0 && head(pipettesWithTip)?.specs != null

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
        const pipettesWithTipAndSpecs = filterPipettesWithTips(
          pipettesWithTipsData
        ).sort((a, b) => MOUNT_ORDER[a.mount] - MOUNT_ORDER[b.mount])

        setPipettesWithTip(pipettesWithTipAndSpecs)

        if (initialPipettesCount === null) {
          setInitialPipettesCount(pipettesWithTipAndSpecs.length)
        }

        return Promise.resolve(pipettesWithTipAndSpecs)
      })
      .catch(e => {
        console.error(`Error during tip status check: ${e.message}`)
        if (initialPipettesCount === null) {
          setInitialPipettesCount(0)
        }
        return Promise.resolve([])
      })
  }, [host, initialPipettesCount])

  const resetTipStatus = (): void => {
    setPipettesWithTip([])
    setInitialPipettesCount(null)
  }

  const resolveAllTips = (): void => {
    setPipettesWithTip([])
  }

  const setTipStatusResolved = (
    onEmptyCache?: () => void,
    onTipsDetected?: () => void
  ): Promise<PipetteWithTip> => {
    return new Promise<PipetteWithTip>(resolve => {
      setPipettesWithTip(prevPipettesWithTip => {
        const newState = [...prevPipettesWithTip.slice(1)]
        if (newState.length === 0) {
          onEmptyCache?.()
        } else {
          onTipsDetected?.()
        }

        resolve(newState[0])
        return newState
      })
    })
  }

  return {
    areTipsAttached,
    determineTipStatus,
    resetTipStatus,
    resolveAllTips,
    aPipetteWithTip,
    setTipStatusResolved,
    initialPipettesWithTipsCount: initialPipettesCount,
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
