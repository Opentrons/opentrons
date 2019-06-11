// @flow
import * as errorCreators from '../../errorCreators'
import updateLiquidState from '../../dispenseUpdateLiquidState'
import type { DispenseArgsV3 } from '@opentrons/shared-data'
import type {
  InvariantContext,
  RobotState,
  CommandCreator,
  CommandCreatorError,
} from '../../types'

/** Dispense with given args. Requires tip. */
const dispense = (args: DispenseArgsV3): CommandCreator => (
  invariantContext: InvariantContext,
  prevRobotState: RobotState
) => {
  const { pipette, volume, labware, well, offsetFromBottomMm, flowRate } = args

  const actionName = 'dispense'
  let errors: Array<CommandCreatorError> = []

  if (!prevRobotState.tipState.pipettes[pipette]) {
    errors.push(
      errorCreators.noTipOnPipette({ actionName, pipette, labware, well })
    )
  }

  if (!labware || !prevRobotState.labware[labware]) {
    errors.push(errorCreators.labwareDoesNotExist({ actionName, labware }))
  }

  if (errors.length > 0) {
    return { errors }
  }

  const commands = [
    {
      command: 'dispense',
      params: {
        pipette,
        volume,
        labware,
        well,
        offsetFromBottomMm,
        flowRate,
      },
    },
  ]

  return {
    commands,
    robotState: {
      ...prevRobotState,
      liquidState: updateLiquidState(
        {
          invariantContext,
          pipetteId: pipette,
          labwareId: labware,
          volume,
          well,
        },
        prevRobotState.liquidState
      ),
    },
  }
}

export default dispense
