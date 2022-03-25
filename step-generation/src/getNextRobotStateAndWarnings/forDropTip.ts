import { dispenseUpdateLiquidState } from './dispenseUpdateLiquidState'
import type { DropTipParams } from '@opentrons/shared-data/protocol/types/schemaV6/command/pipetting'
import type { InvariantContext, RobotStateAndWarnings } from '../types'
export function forDropTip(
  params: DropTipParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { pipetteId, labwareId, wellName } = params
  const { robotState } = robotStateAndWarnings
  dispenseUpdateLiquidState({
    invariantContext,
    prevLiquidState: robotState.liquidState,
    pipetteId,
    labwareId,
    useFullVolume: true,
    wellName,
  })
  robotState.tipState.pipettes[pipetteId] = false
}
