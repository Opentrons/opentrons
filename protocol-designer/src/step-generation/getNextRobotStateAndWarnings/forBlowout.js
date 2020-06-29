// @flow
import type { BlowoutParams } from '@opentrons/shared-data/protocol/flowTypes/schemaV4'

import type { InvariantContext, RobotStateAndWarnings } from '../types'
import { dispenseUpdateLiquidState } from './dispenseUpdateLiquidState'

export function forBlowout(
  params: BlowoutParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { pipette, labware, well } = params
  const { robotState } = robotStateAndWarnings
  dispenseUpdateLiquidState({
    pipette,
    labware,
    useFullVolume: true,
    well,
    prevLiquidState: robotState.liquidState,
    invariantContext,
  })
}
