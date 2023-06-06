import type { MoveLabwareParams } from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'
import type { InvariantContext, RobotStateAndWarnings } from '../types'

export function forMoveLabware(
  params: MoveLabwareParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { labwareId, newLocation } = params
  const { robotState } = robotStateAndWarnings

  robotState.labware[labwareId].slot = String(newLocation)
}
