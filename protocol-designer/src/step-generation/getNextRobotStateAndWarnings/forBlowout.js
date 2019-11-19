// @flow
import updateLiquidState from '../dispenseUpdateLiquidState'
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
      liquidState: updateLiquidState(
        {
          invariantContext,
          pipetteId: pipette,
          labwareId: labware,
          useFullVolume: true,
          well,
        },
        prevRobotState.liquidState
      ),
    },
  }
}
