// @flow
import type { PipetteAccessParams } from '@opentrons/shared-data/protocol/flowTypes/schemaV3'

import type { InvariantContext, RobotStateAndWarnings } from '../types'
import { dispenseUpdateLiquidState } from './dispenseUpdateLiquidState'

export function forDropTip(
  params: PipetteAccessParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { pipette, labware, well } = params
  const { robotState } = robotStateAndWarnings

  dispenseUpdateLiquidState({
    invariantContext,
    prevLiquidState: robotState.liquidState,
    pipette,
    labware,
    useFullVolume: true,
    well,
  })

  robotState.tipState.pipettes[pipette] = false
}
