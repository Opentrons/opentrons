import type { InvariantContext, RobotStateAndWarnings } from '../types'
import type { LoadLiquidCreateCommand } from '@opentrons/shared-data'

export function forLoadLiquid(
  params: LoadLiquidCreateCommand['params'],
  _invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { labwareId, liquidId, volumeByWell } = params
  Object.entries(volumeByWell).forEach(([wellName, volume]) => {
    robotStateAndWarnings.robotState.liquidState.labware[labwareId][wellName][
      liquidId
    ] = { volume }
  })
}
