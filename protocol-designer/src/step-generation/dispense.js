// @flow
import * as errorCreators from './errorCreators'
import updateLiquidState from './dispenseUpdateLiquidState'
import type {RobotState, CommandCreator, CommandCreatorError, AspirateDispenseArgs} from './'

/** Dispense with given args. Requires tip. */
const dispense = (args: AspirateDispenseArgs): CommandCreator => (prevRobotState: RobotState) => {
  const {pipette, volume, labware, well, offsetFromBottomMm} = args

  const actionName = 'dispense'
  let errors: Array<CommandCreatorError> = []

  if (prevRobotState.tipState.pipettes[pipette] === false) {
    errors.push(errorCreators.noTipOnPipette({actionName, pipette, labware, well}))
  }

  if (!labware || !prevRobotState.labware[labware]) {
    errors.push(errorCreators.labwareDoesNotExist({actionName, labware}))
  }

  if (errors.length > 0) {
    return {errors}
  }

  const commands = [{
    command: 'dispense',
    params: {
      pipette,
      volume,
      labware,
      well,
      offsetFromBottomMm: offsetFromBottomMm == null
        ? undefined
        : offsetFromBottomMm
    }
  }]

  return {
    commands,
    robotState: {
      ...prevRobotState,
      liquidState: updateLiquidState({
        pipetteId: pipette,
        pipetteData: prevRobotState.instruments[pipette],
        labwareId: labware,
        labwareType: prevRobotState.labware[labware].type,
        volume,
        well
      }, prevRobotState.liquidState)
    }
  }
}

export default dispense
