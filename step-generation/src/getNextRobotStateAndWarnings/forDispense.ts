import { dispenseUpdateLiquidState } from './dispenseUpdateLiquidState'

import type { InvariantContext, RobotStateAndWarnings } from '../types'
import type { AspDispAirgapParams } from '@opentrons/shared-data'

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
    robotStateAndWarnings,
  })
}
