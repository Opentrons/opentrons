import { dispenseUpdateLiquidState } from './dispenseUpdateLiquidState'

import type {
  AspDispAirgapParams,
  DispenseInPlaceParams,
} from '@opentrons/shared-data'
import type { InvariantContext, RobotStateAndWarnings } from '../types'

export function forDispense(
  params: AspDispAirgapParams | DispenseInPlaceParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { pipetteId, volume } = params
  const { robotState } = robotStateAndWarnings
  const labwareId =
    'labwareId' in params
      ? params.labwareId
      : robotState.pipettes[pipetteId].labwareId ?? ''
  const wellName =
    'wellName' in params
      ? params.wellName
      : robotState.pipettes[pipetteId].wellName ?? ''
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
