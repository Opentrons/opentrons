import type { InvariantContext, RobotStateAndWarnings } from '../types'
import { LoadLiquidCreateCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'

export function forLoadLiquid(
  params: LoadLiquidCreateCommand['params'],
  _invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { labwareId, liquidId, volumeByWell } = params
  const { robotState } = robotStateAndWarnings
  const { liquidState } = robotState

  Object.entries(volumeByWell).forEach(([wellName, volume]) => {
    liquidState.labware[labwareId][wellName][liquidId] = { volume }
  })
}
