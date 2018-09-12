// @flow
// import cloneDeep from 'lodash/cloneDeep'
import {noTipOnPipette, pipetteDoesNotExist} from './errorCreators'
import type {RobotState, CommandCreator, CommandCreatorError, PipetteLabwareFields} from './'

const touchTip = (args: PipetteLabwareFields): CommandCreator => (prevRobotState: RobotState) => {
  /** touchTip with given args. Requires tip. */
  const actionName = 'touchTip'
  const {pipette, labware, well} = args

  const pipetteData = prevRobotState.instruments[pipette]

  let errors: Array<CommandCreatorError> = []

  if (!pipetteData) {
    errors.push(pipetteDoesNotExist({actionName, pipette}))
  }

  if (prevRobotState.tipState.pipettes[pipette] === false) {
    errors.push(noTipOnPipette({actionName, pipette, labware, well}))
  }

  if (errors.length > 0) {
    return {errors}
  }

  const commands = [{
    command: 'touch-tip',
    params: {
      pipette,
      labware,
      well,
    },
  }]

  return {
    commands,
    robotState: prevRobotState,
  }
}

export default touchTip
