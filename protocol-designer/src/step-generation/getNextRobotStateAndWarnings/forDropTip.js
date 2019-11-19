// @flow
import updateLiquidState from '../dispenseUpdateLiquidState'
import type { PipetteAccessParams } from '@opentrons/shared-data/protocol/flowTypes/schemaV3'
import type {
  InvariantContext,
  RobotState,
  RobotStateAndWarnings,
} from '../types'

export function forDropTip(
  params: PipetteAccessParams,
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
      tipState: {
        ...prevRobotState.tipState,
        pipettes: {
          ...prevRobotState.tipState.pipettes,
          [pipette]: false,
        },
      },
    },
  }
}
