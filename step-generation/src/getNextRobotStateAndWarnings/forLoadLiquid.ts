import type { InvariantContext, RobotStateAndWarnings } from '../types'
import { LoadLiquidCreateCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'

export function forLoadLiquid(
  params: LoadLiquidCreateCommand['params'],
  _invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { labwareId, liquidId, volumeByWell } = params
  console.log('LOAD LICU')
  Object.entries(volumeByWell).forEach(([wellName, volume]) => {
    robotStateAndWarnings.robotState.liquidState.labware[labwareId][wellName][
      liquidId
    ] = { volume }
  })
}
