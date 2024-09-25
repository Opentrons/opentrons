import { useState } from 'react'

import { RECOVERY_MAP } from '../constants'

import type { IRecoveryMap, RecoveryRoute, ValidDropTipSubMap } from '../types'

// Utils for getting/setting the current submap. See useRecoveryRouting.
export interface SubMapUtils {
  /* See useRecoveryRouting. */
  updateSubMap: (subMap: ValidDropTipSubMap | null) => void
  /* See useRecoveryRouting. */
  subMap: ValidDropTipSubMap | null
}

export interface UseRecoveryRoutingResult {
  recoveryMap: IRecoveryMap
  currentRecoveryOptionUtils: CurrentRecoveryOptionUtils
  setRM: (map: IRecoveryMap) => void
  updateSubMap: SubMapUtils['updateSubMap']
  subMap: SubMapUtils['subMap']
}

/**
 * ER Wizard routing. Also provides access to the routing of any other flow launched from ER.
 * Recovery Route: A logically-related collection of recovery steps or a single step if unrelated to any existing recovery route.
 * Recovery Step: Analogous to a "step" in other wizard flows.
 * SubMap: Used for more granular routing, when required.
 *
 */
export function useRecoveryRouting(): UseRecoveryRoutingResult {
  const [recoveryMap, setRecoveryMap] = useState<IRecoveryMap>({
    route: RECOVERY_MAP.OPTION_SELECTION.ROUTE,
    step: RECOVERY_MAP.OPTION_SELECTION.STEPS.SELECT,
  })

  const [subMap, setSubMap] = useState<ValidDropTipSubMap | null>(null)

  const currentRecoveryOptionUtils = useSelectedRecoveryOption()

  return {
    recoveryMap,
    currentRecoveryOptionUtils,
    setRM: setRecoveryMap,
    updateSubMap: setSubMap,
    subMap,
  }
}

export interface CurrentRecoveryOptionUtils {
  selectedRecoveryOption: RecoveryRoute | null
  setSelectedRecoveryOption: (option: RecoveryRoute) => void
}

// The most recently selected recovery option, if any.
export function useSelectedRecoveryOption(): CurrentRecoveryOptionUtils {
  const [
    selectedRecoveryOption,
    setSelectedRecoveryOption,
  ] = useState<RecoveryRoute | null>(null)

  return {
    selectedRecoveryOption,
    setSelectedRecoveryOption,
  }
}
