// @flow
// import cloneDeep from 'lodash/cloneDeep'
import type {RobotState, CommandReducer, PipetteLabwareFields} from './'

const blowout = (args: PipetteLabwareFields): CommandReducer => (prevRobotState: RobotState) => {
  /** Blowout with given args. Requires tip. */
  const {pipette, labware, well} = args

  const pipetteData = prevRobotState.instruments[pipette]

  if (!pipetteData) {
    throw new Error(`Attempted to blowout with pipette id "${pipette}", this pipette was not found under "instruments"`)
  }

  if (prevRobotState.tipState.pipettes[pipette] === false) {
    throw new Error(`Attempted to blowout with no tip on pipette ${pipette} from ${labware} well ${well}`)
  }

  const commands = [{
    command: 'blowout',
    pipette,
    labware,
    well
  }]

  return {
    commands,
    robotState: prevRobotState // TODO LATER deep clone robotState and manipulate it for liquid tracking here?
  }
}

export default blowout
