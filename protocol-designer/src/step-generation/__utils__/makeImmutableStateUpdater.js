// @flow
import produce from 'immer'

import type { InvariantContext, RobotState, RobotStateAndWarnings } from '../'

export type ImmutableStateUpdater<P> = (
  params: P,
  invariantContext: InvariantContext,
  robotState: RobotState
) => RobotStateAndWarnings

export type MutableStateUpdater<P> = (
  params: P,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
) => void

export function makeImmutableStateUpdater<P>(
  commandFn: MutableStateUpdater<P>
): ImmutableStateUpdater<P> {
  return (params, invariantContext, robotState) => {
    const robotStateAndWarnings = {
      warnings: [],
      robotState,
    }
    return produce(robotStateAndWarnings, draft => {
      commandFn(params, invariantContext, draft)
    })
  }
}
