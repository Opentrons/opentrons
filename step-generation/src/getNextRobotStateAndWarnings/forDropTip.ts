import { dispenseUpdateLiquidState } from './dispenseUpdateLiquidState'
import type { DropTipParams } from '@opentrons/shared-data/protocol/types/schemaV6/command/pipetting'
import type { InvariantContext, RobotStateAndWarnings } from '../types'

//  NOTE(jr, 12/1/23): this state update is not in use currently for PD 8.0
//  since we only support dropping tip into the waste chute or trash bin
//  which are both addressableAreas (so the commands are moveToAddressableArea
//  and dropTipInPlace) We will use this again when we add return tip.
export function forDropTip(
  params: DropTipParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { pipetteId, wellName, labwareId } = params
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
