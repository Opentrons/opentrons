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
  const entityId =
    'labwareId' in params
      ? params.labwareId
      : robotState.pipettes[pipetteId].location ?? ''
  const wellName =
    'wellName' in params
      ? params.wellName
      : robotState.pipettes[pipetteId].wellName ?? ''

  dispenseUpdateLiquidState({
    invariantContext,
    entityId,
    pipetteId,
    prevLiquidState: robotState.liquidState,
    useFullVolume: false,
    volume,
    wellName,
    robotStateAndWarnings,
  })
}
