// @flow
import { dispenseUpdateLiquidState } from './dispenseUpdateLiquidState'
import type { DispenseParams } from '@opentrons/shared-data/protocol/flowTypes/schemaV3'
import type {
  InvariantContext,
  RobotState,
  RobotStateAndWarnings,
} from '../types'

export function forDispense(
  params: DispenseParams,
  invariantContext: InvariantContext,
  prevRobotState: RobotState
): RobotStateAndWarnings {
  const { labware, pipette, volume, well } = params
  const nextLiquidState = dispenseUpdateLiquidState({
    invariantContext,
    labware,
    pipette,
    prevLiquidState: prevRobotState.liquidState,
    useFullVolume: false,
    volume,
    well,
  })
  return {
    robotState: {
      ...prevRobotState,
      liquidState: nextLiquidState,
    },
    warnings: [],
  }
}
