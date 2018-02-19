// @flow
// import cloneDeep from 'lodash/cloneDeep'
import type {RobotState, CommandCreator, PipetteLabwareFields} from './'

const touchTip = (args: PipetteLabwareFields): CommandCreator => (prevRobotState: RobotState) => {
  /** touchTip with given args. Requires tip. */
  const {pipette, labware, well} = args

  const pipetteData = prevRobotState.instruments[pipette]

  if (!pipetteData) {
    throw new Error(`Attempted to touchTip with pipette id "${pipette}", this pipette was not found under "instruments"`)
  }

  if (prevRobotState.tipState.pipettes[pipette] === false) {
    throw new Error(`Attempted to touchTip with no tip on pipette: ${pipette} from ${labware}'s well ${well}`)
  }

  const commands = [{
    command: 'touch-tip',
    pipette,
    labware,
    well
  }]

  return {
    commands,
    robotState: prevRobotState // TODO LATER deep clone robotState and manipulate it for liquid tracking here?
  }
}

export default touchTip
