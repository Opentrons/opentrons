import * as React from 'react'

import { RECOVERY_MAP } from '../constants'

import type { IRecoveryMap } from '../types'

/**
 * ER Wizard routing.
 * Recovery Route: A logically-related collection of recovery steps or a single step if unrelated to any existing recovery route.
 * Recovery Step: Analogous to a "step" in other wizard flows.
 *
 * @return {trackExternalStep} Used to keep track of the current step in other flows launched from Error Recovery, ex. Drop Tip flows.
 * Note that for multi-app routing to work properly, each sub step much be unique, ie, other flows used by Error Recovery
 * cannot have two identical steps.
 */

export function useRecoveryRouting(): {
  recoveryMap: IRecoveryMap
  setRM: (map: IRecoveryMap) => void
  trackExternalStep: (step: string) => void
} {
  const [recoveryMap, setRecoveryMap] = React.useState<IRecoveryMap>({
    route: RECOVERY_MAP.OPTION_SELECTION.ROUTE,
    step: RECOVERY_MAP.OPTION_SELECTION.STEPS.SELECT,
  })

  // If we do multi-app routing, concat the sub-step to the error recovery routing.
  const [, setSubStep] = React.useState<string | null>(null)

  return {
    recoveryMap,
    setRM: setRecoveryMap,
    trackExternalStep: setSubStep,
  }
}
