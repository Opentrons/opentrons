// @flow
import type {RobotState, CommandCreator, AspirateDispenseArgs} from './'
import updateLiquidState from './dispenseUpdateLiquidState'

const dispense = (args: AspirateDispenseArgs): CommandCreator => (prevRobotState: RobotState) => {
  /** Dispense with given args. Requires tip. */
  const {pipette, volume, labware, well} = args

  if (prevRobotState.tipState.pipettes[pipette] === false) {
    throw new Error(`Attempted to dispense with no tip on pipette: ${volume} uL with ${pipette} from ${labware}'s well ${well}`)
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
