import * as React from 'react'
import head from 'lodash/head'

import { getPipetteModelSpecs } from '@opentrons/shared-data'

import { getPipettesWithTipAttached } from './getPipettesWithTipAttached'
import { useDropTipRouting, useDropTipWithType } from './hooks'
import { DropTipWizard } from './DropTipWizard'

import type { PipetteModelSpecs, RobotType } from '@opentrons/shared-data'
import type { Mount, PipetteData } from '@opentrons/api-client'
import type { FixitCommandTypeUtils, IssuedCommandsType } from './types'
import type { GetPipettesWithTipAttached } from './getPipettesWithTipAttached'
import { useInstrumentsQuery } from '@opentrons/react-api-client'

/** Provides the user toggle for rendering Drop Tip Wizard Flows.
 *
 * NOTE: Rendering these flows is independent of whether tips are actually attached. First use useTipAttachmentStatus
 * to get tip attachment status.
 */
export function useDropTipWizardFlows(): {
  showDTWiz: boolean
  toggleDTWiz: () => void
} {
  const [showDTWiz, setShowDTWiz] = React.useState(false)

  const toggleDTWiz = (): void => {
    setShowDTWiz(!showDTWiz)
  }

  return { showDTWiz, toggleDTWiz }
}

export interface DropTipWizardFlowsProps {
  robotType: RobotType
  mount: PipetteData['mount']
  instrumentModelSpecs: PipetteModelSpecs
  /* isTakeover allows for optionally specifying a different callback if a different client cancels the "setup" type flow. */
  closeFlow: (isTakeover?: boolean) => void
  /* Optional. If provided, DT will issue "fixit" commands and render alternate Error Recovery compatible views. */
  fixitCommandTypeUtils?: FixitCommandTypeUtils
}

export function DropTipWizardFlows(
  props: DropTipWizardFlowsProps
): JSX.Element {
  const { fixitCommandTypeUtils } = props

  const issuedCommandsType: IssuedCommandsType =
    fixitCommandTypeUtils != null ? 'fixit' : 'setup'

  const dropTipWithTypeUtils = useDropTipWithType({
    ...props,
    issuedCommandsType,
  })

  const dropTipRoutingUtils = useDropTipRouting(fixitCommandTypeUtils)

  return (
    <DropTipWizard
      {...props}
      {...dropTipWithTypeUtils}
      {...dropTipRoutingUtils}
      issuedCommandsType={issuedCommandsType}
    />
  )
}

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
  const [pipettesWithTip, setPipettesWithTip] = React.useState<
    PipetteWithTip[]
  >([])
  const [initialPipettesCount, setInitialPipettesCount] = React.useState<
    number | null
  >(null)
  const { data: attachedInstruments } = useInstrumentsQuery({
    refetchInterval: INSTRUMENTS_POLL_MS,
  })

  const aPipetteWithTip = head(pipettesWithTip) ?? null
  const areTipsAttached =
    pipettesWithTip.length > 0 && head(pipettesWithTip)?.specs != null

  const determineTipStatus = React.useCallback((): Promise<
    PipetteWithTip[]
  > => {
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
