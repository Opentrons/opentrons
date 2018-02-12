// @flow
// import cloneDeep from 'lodash/cloneDeep'
import type {RobotState, CommandReducer, AspirateDispenseArgs} from './'

const aspirate = (args: AspirateDispenseArgs): CommandReducer => (prevRobotState: RobotState) => {
  /** Aspirate with given args. Requires tip. */
  const {pipette, volume, labware, well} = args

  const pipetteData = prevRobotState.instruments[pipette]

  if (!pipetteData) {
    throw new Error(`Attempted to aspirate with pipette id "${pipette}", this pipette was not found under "instruments"`)
  }

  if (prevRobotState.tipState.pipettes[pipette] === false) {
    throw new Error(`Attempted to aspirate with no tip on pipette: ${volume} uL with ${pipette} from ${labware}'s well ${well}`)
  }

  if (pipetteData.maxVolume < volume) {
    throw new Error(`Attempted to aspirate volume greater than pipette max volume (${volume} > ${pipetteData.maxVolume})`)
  }

  const commands = [{
    command: 'aspirate',
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

export default aspirate
