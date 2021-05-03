// @flow
import { dispenseUpdateLiquidState } from './dispenseUpdateLiquidState'
import type { DispenseParams } from '@opentrons/shared-data/protocol/flowTypes/schemaV3'
import type { InvariantContext, RobotStateAndWarnings } from '../types'

export function forDispense(
  params: DispenseParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { labware, pipette, volume, well } = params
  const { robotState } = robotStateAndWarnings

  dispenseUpdateLiquidState({
    invariantContext,
    labware,
    pipette,
    prevLiquidState: robotState.liquidState,
    useFullVolume: false,
    volume,
    well,
  })
}
