import type { MoveToWellParams } from '@opentrons/shared-data'
import type { InvariantContext, RobotStateAndWarnings } from '../types'

export function forMoveToWell(
  params: MoveToWellParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { pipetteId, labwareId, wellName } = params
  const { robotState } = robotStateAndWarnings
  robotState.pipettes[pipetteId] = {
    ...robotState.pipettes[pipetteId],
    entityId: labwareId,
    wellName: wellName,
  }
}
