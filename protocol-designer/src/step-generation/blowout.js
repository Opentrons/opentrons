// @flow
import type {RobotState, CommandCreator, PipetteLabwareFields} from './'

import updateLiquidState from './dispenseUpdateLiquidState'

const blowout = (args: PipetteLabwareFields): CommandCreator => (prevRobotState: RobotState) => {
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
    robotState: {
      ...prevRobotState,
      liquidState: updateLiquidState({
        pipetteId: pipette,
        pipetteData,
        labwareId: labware,
        labwareType: prevRobotState.labware[labware].type,
        volume: pipetteData.maxVolume, // update liquid state as if it was a dispense, but with max volume of pipette
        well
      }, prevRobotState.liquidState)
    }
  }
}

export default blowout
