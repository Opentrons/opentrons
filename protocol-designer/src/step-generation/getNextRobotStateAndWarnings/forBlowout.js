// @flow
import { dispenseUpdateLiquidState } from './dispenseUpdateLiquidState'
import type { BlowoutParams } from '@opentrons/shared-data/protocol/flowTypes/schemaV4'
import type { InvariantContext, RobotStateAndWarnings } from '../types'

export function forBlowout(
  params: BlowoutParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { pipette, labware, well } = params
  const { robotState, warnings } = robotStateAndWarnings
  dispenseUpdateLiquidState({
    pipette,
    labware,
    useFullVolume: true,
    warnings,
    well,
    prevLiquidState: robotState.liquidState,
    invariantContext,
  })
}
