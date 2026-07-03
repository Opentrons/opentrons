import { CLEAN, DIRTY, EMPTY } from '../constants'

import type { SetTipStateParams, TipWellState } from '@opentrons/shared-data'
import type { InvariantContext, RobotStateAndWarnings } from '../types'

const TIP_WELL_STATE_TO_ROBOT_STATE: Record<
  NonNullable<TipWellState>,
  typeof CLEAN | typeof DIRTY | typeof EMPTY
> = {
  clean: CLEAN,
  empty: EMPTY,
  used: DIRTY,
}

export function forSetTipState(
  params: SetTipStateParams,
  _invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { labwareId, wellNames, tipWellState = 'clean' } = params
  const nextState = TIP_WELL_STATE_TO_ROBOT_STATE[tipWellState]
  const tiprackState =
    robotStateAndWarnings.robotState.tipState.tipracks[labwareId]

  if (tiprackState == null) {
    return
  }

  wellNames.forEach(wellName => {
    tiprackState[wellName] = nextState
  })
}
