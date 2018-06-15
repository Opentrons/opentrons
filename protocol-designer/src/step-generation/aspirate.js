// @flow
import updateLiquidState from './aspirateUpdateLiquidState'
import * as errorCreators from './errorCreators'
import type {RobotState, CommandCreator, CommandCreatorError, AspirateDispenseArgs} from './'

/** Aspirate with given args. Requires tip. */
const aspirate = (args: AspirateDispenseArgs): CommandCreator => (prevRobotState: RobotState) => {
  const {pipette, volume, labware, well} = args

  const actionName = 'aspirate'
  let errors: Array<CommandCreatorError> = []

  const pipetteData: ?* = prevRobotState.instruments[pipette]

  if (!pipetteData) {
    errors.push(errorCreators.pipetteDoesNotExist({actionName, pipette}))
  }

  if (prevRobotState.tipState.pipettes[pipette] === false) {
    errors.push(errorCreators.noTipOnPipette({actionName, pipette, volume, labware, well}))
  }

  if (pipetteData && pipetteData.maxVolume < volume) {
    errors.push(errorCreators.pipetteVolumeExceeded({actionName, volume, maxVolume: pipetteData.maxVolume}))
  }

  if (!labware || !prevRobotState.labware[labware]) {
    errors.push(errorCreators.labwareDoesNotExist({actionName, labware}))
  }

  if (errors.length > 0) {
    return {errors}
  }

  const commands = [{
    command: 'aspirate',
    params: {
      pipette,
      volume,
      labware,
      well
    }
  }]

  const liquidStateAndWarnings = updateLiquidState({
    pipetteId: pipette,
    pipetteData: prevRobotState.instruments[pipette],
    labwareId: labware,
    labwareType: prevRobotState.labware[labware].type,
    volume,
    well
  }, prevRobotState.liquidState)

  const {liquidState, warnings: liquidUpdateWarnings} = liquidStateAndWarnings

  const robotState = {
    ...prevRobotState,
    liquidState
  }

  return {
    commands,
    robotState,
    warnings: liquidUpdateWarnings
  }
}

export default aspirate
