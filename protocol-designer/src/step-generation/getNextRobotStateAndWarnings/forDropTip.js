// @flow
import { dispenseUpdateLiquidState } from './dispenseUpdateLiquidState'
import type { PipetteAccessParams } from '@opentrons/shared-data/protocol/flowTypes/schemaV3'
import type { InvariantContext, RobotStateAndWarnings } from '../types'

export function forDropTip(
  params: PipetteAccessParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { pipette, labware, well } = params
  const { robotState, warnings } = robotStateAndWarnings

  dispenseUpdateLiquidState({
    invariantContext,
    prevLiquidState: robotState.liquidState,
    pipette,
    labware,
    useFullVolume: true,
    warnings,
    well,
  })

  robotState.tipState.pipettes[pipette] = false
}
