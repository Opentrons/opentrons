// @flow
import produce from 'immer'
import type {
  RobotState,
  RobotStateAndWarnings,
  InvariantContext,
} from '../../'

type ImmutableStateUpdater<P> = (
  params: P,
  invariantContext: InvariantContext,
  robotState: RobotState
) => RobotStateAndWarnings

type MutableStateUpdater<P> = (
  params: P,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
) => void

export function makeImmutableStateUpdater<C>(
  commandFn: MutableStateUpdater<C>
): ImmutableStateUpdater<C> {
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
