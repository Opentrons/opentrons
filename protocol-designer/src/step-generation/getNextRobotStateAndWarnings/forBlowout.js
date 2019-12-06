// @flow
import { dispenseUpdateLiquidState } from './dispenseUpdateLiquidState'
import type { BlowoutParams } from '@opentrons/shared-data/protocol/flowTypes/schemaV4'
import type {
  InvariantContext,
  RobotState,
  RobotStateAndWarnings,
} from '../types'

export function forBlowout(
  params: BlowoutParams,
  invariantContext: InvariantContext,
  prevRobotState: RobotState
): RobotStateAndWarnings {
  const { pipette, labware, well } = params
  return {
    warnings: [],
    robotState: {
      ...prevRobotState,
      liquidState: dispenseUpdateLiquidState({
        pipette,
        labware,
        useFullVolume: true,
        well,
        prevLiquidState: prevRobotState.liquidState,
        invariantContext,
      }),
    },
  }
}
