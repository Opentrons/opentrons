import { MoveToAddressableAreaArgs } from '../commandCreators/atomic/moveToAddressableArea'
import type { InvariantContext, RobotStateAndWarnings } from '../types'

export function forMoveToAddressableArea(
  params: MoveToAddressableAreaArgs,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  //    TODO(jr, 11/3/23): wire up state change for dispense, blow_out, and drop tip into waste chute
}
