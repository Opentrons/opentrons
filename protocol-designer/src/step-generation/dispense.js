// @flow
import * as errorCreators from './errorCreators'
import updateLiquidState from './dispenseUpdateLiquidState'
import type {RobotState, CommandCreator, CommandCreatorError, AspirateDispenseArgs} from './'

/** Dispense with given args. Requires tip. */
const dispense = (args: AspirateDispenseArgs): CommandCreator => (prevRobotState: RobotState) => {
  const {pipette, volume, labware, well} = args

  const actionName = 'dispense'
  let errors: Array<CommandCreatorError> = []

  if (prevRobotState.tipState.pipettes[pipette] === false) {
    errors.push(errorCreators.noTipOnPipette({actionName, pipette, labware, well}))
  }

  if (errors.length > 0) {
    return {errors}
  }

  const commands = [{
    command: 'dispense',
    pipette,
    volume,
    labware,
    well
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
