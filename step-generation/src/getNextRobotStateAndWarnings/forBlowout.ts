import { dispenseUpdateLiquidState } from './dispenseUpdateLiquidState'
import type { BlowoutParams } from '@opentrons/shared-data/protocol/types/schemaV6/command/pipetting'
import type { InvariantContext, RobotStateAndWarnings } from '../types'
export function forBlowout(
  params: BlowoutParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { pipetteId, labwareId, wellName } = params
  const { robotState } = robotStateAndWarnings
  dispenseUpdateLiquidState({
    pipetteId,
    labwareId,
    useFullVolume: true,
    wellName,
    prevLiquidState: robotState.liquidState,
    invariantContext,
  })
}
