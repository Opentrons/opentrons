import { useState, useCallback } from 'react'
import head from 'lodash/head'

import { useInstrumentsQuery } from '@opentrons/react-api-client'
import { getPipetteModelSpecs } from '@opentrons/shared-data'

import { getPipettesWithTipAttached } from './getPipettesWithTipAttached'

import type { Mount } from '@opentrons/api-client'
import type { PipetteModelSpecs } from '@opentrons/shared-data'
import type { GetPipettesWithTipAttached } from './getPipettesWithTipAttached'

const INSTRUMENTS_POLL_MS = 5000

export interface PipetteWithTip {
  mount: Mount
  specs: PipetteModelSpecs
}

export interface TipAttachmentStatusResult {
  /** Updates the pipettes with tip cache. Determine whether tips are likely attached on one or more pipettes.
   *
   * NOTE: Use responsibly! This function can potentially (but not likely) iterate over the entire length of a protocol run.
   * */
  determineTipStatus: () => Promise<PipetteWithTip[]>
  /* Whether tips are likely attached on *any* pipette. Typically called after determineTipStatus() */
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
  /* Relevant pipette information for a pipette with a tip attached. If both pipettes have tips attached, return the left pipette. */
  aPipetteWithTip: PipetteWithTip | null
  /* The initial number of pipettes with tips. Null if there has been no tip check yet. */
  initialPipettesWithTipsCount: number | null
}

// Returns various utilities for interacting with the cache of pipettes with tips attached.
export function useTipAttachmentStatus(
  params: Omit<GetPipettesWithTipAttached, 'attachedInstruments'>
): TipAttachmentStatusResult {
  const [pipettesWithTip, setPipettesWithTip] = useState<PipetteWithTip[]>([])
  const [initialPipettesCount, setInitialPipettesCount] = useState<
    number | null
  >(null)
  const { data: attachedInstruments } = useInstrumentsQuery({
    refetchInterval: INSTRUMENTS_POLL_MS,
  })

  const aPipetteWithTip = head(pipettesWithTip) ?? null
  const areTipsAttached =
    pipettesWithTip.length > 0 && head(pipettesWithTip)?.specs != null

  const determineTipStatus = useCallback((): Promise<PipetteWithTip[]> => {
    return getPipettesWithTipAttached({
      ...params,
      attachedInstruments: attachedInstruments ?? null,
    }).then(pipettesWithTip => {
      const pipettesWithTipsData = pipettesWithTip.map(pipette => {
        const specs = getPipetteModelSpecs(pipette.instrumentModel)
        return {
          specs,
          mount: pipette.mount,
        }
      })
      const pipettesWithTipAndSpecs = pipettesWithTipsData.filter(
        pipette => pipette.specs != null
      ) as PipetteWithTip[]

      setPipettesWithTip(pipettesWithTipAndSpecs)
      // Set only once.
      if (initialPipettesCount === null) {
        setInitialPipettesCount(pipettesWithTipAndSpecs.length)
      }

      return Promise.resolve(pipettesWithTipAndSpecs)
    })
  }, [params])

  const resetTipStatus = (): void => {
    setPipettesWithTip([])
    setInitialPipettesCount(null)
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
    aPipetteWithTip,
    setTipStatusResolved,
    initialPipettesWithTipsCount: initialPipettesCount,
  }
}
