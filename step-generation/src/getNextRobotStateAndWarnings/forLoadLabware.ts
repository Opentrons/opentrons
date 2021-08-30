import type { LoadEntityParams } from '@opentrons/shared-data/protocol/types/schemaV6'
import type { InvariantContext, RobotStateAndWarnings } from '../types'

export function forLoadLabware(
  params: LoadEntityParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { robotState } = robotStateAndWarnings
  const { labware } = robotState
  // TODO: IMMEDIATELY implement load labware
}
