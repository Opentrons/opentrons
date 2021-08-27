import type { LoadLiquidParams } from '@opentrons/shared-data/protocol/types/schemaV6'
import type { InvariantContext, RobotStateAndWarnings } from '../types'

export function forLoadLiquid(
  params: LoadLiquidParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { labwareId, liquidId, volumeByWell } = params
  const { robotState } = robotStateAndWarnings
  const { liquidState } = robotState
  Object.entries(volumeByWell).forEach(([well, volume]) => {
    liquidState.labware[labwareId][well] = {
      ...liquidState.labware[labwareId][well],
      [liquidId]: { volume },
    }
  })
}
