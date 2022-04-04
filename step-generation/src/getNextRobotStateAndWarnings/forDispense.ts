import { dispenseUpdateLiquidState } from './dispenseUpdateLiquidState'
import type { AspDispAirgapParams } from '@opentrons/shared-data/protocol/types/schemaV6/command/pipetting'
import type { InvariantContext, RobotStateAndWarnings } from '../types'
export function forDispense(
  params: AspDispAirgapParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { labwareId, pipetteId, volume, wellName } = params
  const { robotState } = robotStateAndWarnings
  dispenseUpdateLiquidState({
    invariantContext,
    labwareId,
    pipetteId,
    prevLiquidState: robotState.liquidState,
    useFullVolume: false,
    volume,
    wellName,
  })
}
