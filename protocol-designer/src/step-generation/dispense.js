// @flow
// import cloneDeep from 'lodash/cloneDeep'
import type {RobotState, CommandReducer, AspirateDispenseArgs} from './'

// TODO Ian 2018-02-12 dispense is almost identical to aspirate, what will change? Should they share code?
const dispense = (args: AspirateDispenseArgs): CommandReducer => (prevRobotState: RobotState) => {
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
    robotState: prevRobotState // TODO LATER deep clone robotState and manipulate it for liquid tracking here?
  }
}

export default dispense
